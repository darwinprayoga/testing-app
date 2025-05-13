"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Archive, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useStorage } from "@/contexts/storage-context";
import type { TodoItem } from "@/types/todo";
import { TodoList } from "./todo-list";
import { TodoEtaDialog } from "./todo-eta-dialog";
import { getRandomJokes } from "@/data/jokes";
import { useDebouncedCallback } from "use-debounce";
import { autoResizeTextarea } from "@/utils/todo-utils";
import { useEffect, useRef, useState } from "react";
import { todoService } from "@/utils/supabase/services";
import { useAuth } from "@/contexts/auth-context";
import { sanitizedUsername } from "@/components/profile/profile-tab";

export function Todo() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("active");
  const [etaDialogOpen, setEtaDialogOpen] = useState<boolean>(false);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [selectedEtaDate, setSelectedEtaDate] = useState<Date>(new Date());
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const { t, currentLanguage } = useLanguage();
  const { getItem, setItem, isStorageReady, storageType } = useStorage();
  const { thisUser } = useAuth();

  const persist = useDebouncedCallback((key: string, value: any) => {
    if (isStorageReady) setItem(key, value);
  }, 300);

  useEffect(() => {
    const handleBeforeUnload = () => {
      persist.flush(); // force run pending persist
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [persist]);

  useEffect(() => {
    if (!isStorageReady) return;

    const loadTodosFromStorage = async () => {
      try {
        // If the user is logged in and using cloud storage, fetch todos from Supabase
        if (thisUser && storageType === "cloud") {
          const username = sanitizedUsername(thisUser.user_metadata.full_name || thisUser.email?.split('@')[0] || 'user');
          try {
            const dbTodos = await todoService.getTodos(username);
            if (dbTodos && dbTodos.length > 0) {
              // Transform the database schema to match the app's schema
              const formattedTodos = dbTodos.map(t => ({
                id: t.id,
                text: t.text || "",
                description: t.description || "",
                completed: t.completed || false,
                archived: t.archived || false,
                priority: t.priority || "-",
                createdAt: t.created_at || Date.now(),
              }));
              setTodos(formattedTodos);
            } else {
              // If no todos in database, try local storage
              const savedTodos = await getItem("todos");
              if (Array.isArray(savedTodos)) {
                setTodos(savedTodos);
                
                // Sync local todos to cloud
                savedTodos.forEach(async (todo) => {
                  // Add username field for Supabase
                  await todoService.addTodo({
                    ...todo,
                    username
                  });
                });
              } else {
                loadDummyData();
              }
            }
          } catch (error) {
            console.error("Error fetching todos from database:", error);
            // Fallback to local storage
            const savedTodos = await getItem("todos");
            if (Array.isArray(savedTodos)) {
              setTodos(savedTodos);
            } else {
              loadDummyData();
            }
          }
        } else {
          // Standard local storage flow
          const savedTodos = await getItem("todos");
          if (Array.isArray(savedTodos)) {
            setTodos(savedTodos);
          } else {
            loadDummyData();
          }
        }

        const savedActiveTab = await getItem("todoActiveTab");
        if (savedActiveTab) setActiveTab(savedActiveTab);

        const savedIsAdding = await getItem("todoIsAdding");
        if (savedIsAdding) setIsAdding(savedIsAdding);
      } catch (error) {
        console.error("Error during initialization:", error);
      }
    };

    loadTodosFromStorage();
  }, [isStorageReady, currentLanguage, getItem, thisUser, storageType]);

  const loadDummyData = async () => {
    const savedTodos = await getItem("todos");
    if (Array.isArray(savedTodos)) {
      setTodos(savedTodos);
    } else {
      const jokeItems = getRandomJokes(currentLanguage, "todo", 4);

      const dummyTodos: TodoItem[] = jokeItems.map((joke, index) => ({
        id: (index + 1).toString(),
        text: joke.text || "Lorem ipsum dolor sit amet",
        description: joke.description || "",
        completed: index < 2,
        archived: index === 3,
        priority: joke.priority || (index + 1).toString(),
        createdAt: Date.now() - 86400000 / (index + 1),
      }));

      setTodos(dummyTodos);

      if (isStorageReady) {
        try {
          persist("todos", dummyTodos);
        } catch (error) {
          console.error("Error saving dummy todos to storage:", error);
        }
      } else {
        console.warn("Storage not ready, dummy todos not saved");
      }
    }
  };

  useEffect(() => {
    if (!isStorageReady) return;

    try {
      persist("todos", todos);
    } catch (error) {
      console.error("Failed to save todos to storage:", error);
    }
  }, [todos, isStorageReady, persist]);

  useEffect(() => {
    if (isStorageReady) persist("todoActiveTab", activeTab);
  }, [activeTab, isStorageReady, persist]);

  useEffect(() => {
    if (isStorageReady) persist("todoIsAdding", isAdding);
  }, [isAdding, isStorageReady, persist]);

  useEffect(() => {
    // Focus the first input element when the step changes
    const inputElement = document.querySelector(
      "input:not([disabled])",
    ) as HTMLInputElement;
    if (isAdding) {
      setTimeout(() => {
        inputElement?.focus();
      }, 100);
    }
  }, [isAdding]);

  const addTask = async (text: string) => {
    const oneHourOneMinuteLater = Date.now() + (60 + 60 * 60) * 1000;
    const todoId = Date.now().toString(); // Use timestamp as ID for better uniqueness

    const newTodo: TodoItem = {
      id: todoId,
      text: text,
      description: "",
      completed: false,
      archived: false,
      priority: "-",
      createdAt: oneHourOneMinuteLater,
    };

    const updatedTodos = [...todos, newTodo];
    setTodos(updatedTodos);
    
    // Save to storage
    setTimeout(() => {
      persist("todos", updatedTodos);
    }, 100);
    
    // Save to Supabase if using cloud storage
    if (thisUser && storageType === "cloud") {
      try {
        const username = sanitizedUsername(thisUser.user_metadata.full_name || thisUser.email?.split('@')[0] || 'user');
        await todoService.addTodo({
          ...newTodo,
          username
        });
      } catch (error) {
        console.error("Failed to save todo to Supabase:", error);
      }
    }

    setIsAdding(false);
    setNewTaskText("");
  };

  const toggleComplete = (id: string) => {
    const updatedTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updatedTodos);
    
    // Update in Supabase if using cloud storage
    if (thisUser && storageType === "cloud") {
      try {
        const username = sanitizedUsername(thisUser.user_metadata.full_name || thisUser.email?.split('@')[0] || 'user');
        const todoToUpdate = updatedTodos.find(todo => todo.id === id);
        if (todoToUpdate) {
          todoService.updateTodo({
            ...todoToUpdate,
            username
          });
        }
      } catch (error) {
        console.error("Failed to update todo completion in Supabase:", error);
      }
    }
  };

  const archiveTask = (id: string) => {
    const updatedTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, archived: true } : todo
    );
    setTodos(updatedTodos);
    
    // Update in Supabase if using cloud storage
    if (thisUser && storageType === "cloud") {
      try {
        const username = sanitizedUsername(thisUser.user_metadata.full_name || thisUser.email?.split('@')[0] || 'user');
        const todoToUpdate = updatedTodos.find(todo => todo.id === id);
        if (todoToUpdate) {
          todoService.updateTodo({
            ...todoToUpdate,
            username
          });
        }
      } catch (error) {
        console.error("Failed to update todo archive status in Supabase:", error);
      }
    }
  };

  const deleteTask = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
    setSelectedTasks(selectedTasks.filter((taskId) => taskId !== id));
    
    // Delete from Supabase if using cloud storage
    if (thisUser && storageType === "cloud") {
      try {
        const username = sanitizedUsername(thisUser.user_metadata.full_name || thisUser.email?.split('@')[0] || 'user');
        todoService.deleteTodo(id, username);
      } catch (error) {
        console.error("Failed to delete todo from Supabase:", error);
      }
    }
  };

  const deleteSelectedTasks = () => {
    setTodos(todos.filter((todo) => !selectedTasks.includes(todo.id)));
    
    // Delete selected tasks from Supabase if using cloud storage
    if (thisUser && storageType === "cloud") {
      try {
        const username = sanitizedUsername(thisUser.user_metadata.full_name || thisUser.email?.split('@')[0] || 'user');
        for (const id of selectedTasks) {
          todoService.deleteTodo(id, username).catch(err => {
            console.error(`Failed to delete todo ${id} from Supabase:`, err);
          });
        }
      } catch (error) {
        console.error("Failed to delete selected todos from Supabase:", error);
      }
    }
    
    setSelectedTasks([]);
  };

  const restoreTask = (id: string) => {
    const updatedTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, archived: false } : todo
    );
    setTodos(updatedTodos);
    setSelectedTasks(selectedTasks.filter((taskId) => taskId !== id));
    
    // Update in Supabase if using cloud storage
    if (thisUser && storageType === "cloud") {
      try {
        const username = sanitizedUsername(thisUser.user_metadata.full_name || thisUser.email?.split('@')[0] || 'user');
        const todoToUpdate = updatedTodos.find(todo => todo.id === id);
        if (todoToUpdate) {
          todoService.updateTodo({
            ...todoToUpdate,
            username
          });
        }
      } catch (error) {
        console.error("Failed to update todo restore in Supabase:", error);
      }
    }
  };

  const updateTaskText = (id: string, text: string) => {
    const updatedTodos = todos.map((todo) => (todo.id === id ? { ...todo, text } : todo));
    setTodos(updatedTodos);
    
    // Update in Supabase if using cloud storage
    if (thisUser && storageType === "cloud") {
      try {
        const username = sanitizedUsername(thisUser.user_metadata.full_name || thisUser.email?.split('@')[0] || 'user');
        const todoToUpdate = updatedTodos.find(todo => todo.id === id);
        if (todoToUpdate) {
          todoService.updateTodo({
            ...todoToUpdate,
            username
          });
        }
      } catch (error) {
        console.error("Failed to update todo text in Supabase:", error);
      }
    }
  };

  const updateDescription = (id: string, description: string) => {
    const updatedTodos = todos.map((todo) => (todo.id === id ? { ...todo, description } : todo));
    setTodos(updatedTodos);
    
    // Update in Supabase if using cloud storage
    if (thisUser && storageType === "cloud") {
      try {
        const username = sanitizedUsername(thisUser.user_metadata.full_name || thisUser.email?.split('@')[0] || 'user');
        const todoToUpdate = updatedTodos.find(todo => todo.id === id);
        if (todoToUpdate) {
          todoService.updateTodo({
            ...todoToUpdate,
            username
          });
        }
      } catch (error) {
        console.error("Failed to update todo description in Supabase:", error);
      }
    }
  };

  const updatePriority = (id: string, priority: string) => {
    const updatedTodos = todos.map((todo) => (todo.id === id ? { ...todo, priority } : todo));
    setTodos(updatedTodos);
    
    // Update in Supabase if using cloud storage
    if (thisUser && storageType === "cloud") {
      try {
        const username = sanitizedUsername(thisUser.user_metadata.full_name || thisUser.email?.split('@')[0] || 'user');
        const todoToUpdate = updatedTodos.find(todo => todo.id === id);
        if (todoToUpdate) {
          todoService.updateTodo({
            ...todoToUpdate,
            username
          });
        }
      } catch (error) {
        console.error("Failed to update todo priority in Supabase:", error);
      }
    }
  };

  const openEtaDialog = (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (todo) {
      setSelectedTodoId(id);
      setSelectedEtaDate(new Date(todo.createdAt));
      setEtaDialogOpen(true);
    }
  };

  const updateEta = (date: Date) => {
    if (!selectedTodoId) return;
    
    const updatedTodos = todos.map((todo) =>
      todo.id === selectedTodoId
        ? { ...todo, createdAt: date.getTime() }
        : todo
    );
    setTodos(updatedTodos);
    
    // Update in Supabase if using cloud storage
    if (thisUser && storageType === "cloud") {
      try {
        const username = sanitizedUsername(thisUser.user_metadata.full_name || thisUser.email?.split('@')[0] || 'user');
        const todoToUpdate = updatedTodos.find(todo => todo.id === selectedTodoId);
        if (todoToUpdate) {
          todoService.updateTodo({
            ...todoToUpdate,
            username
          });
        }
      } catch (error) {
        console.error("Failed to update todo ETA in Supabase:", error);
      }
    }
    
    setEtaDialogOpen(false);
    setSelectedTodoId(null);
  };

  const toggleTaskSelection = (id: string) => {
    setSelectedTasks((prev) =>
      prev.includes(id)
        ? prev.filter((taskId) => taskId !== id)
        : [...prev, id],
    );
  };

  const selectAllArchivedTasks = () => {
    const archivedTaskIds = todos
      .filter((todo) => todo.archived)
      .map((todo) => todo.id);

    if (selectedTasks.length === archivedTaskIds.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(archivedTaskIds);
    }
  };

  const archivedTasksCount = todos.filter((todo) => todo.archived).length;
  const allArchivedSelected =
    archivedTasksCount > 0 && selectedTasks.length === archivedTasksCount;

  // add task form
  const [newTaskText, setNewTaskText] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus the textarea when the component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <div className="flex flex-col border rounded-lg min-h-[400px] todo-container">
      <div className="p-2 border-b">
        <Tabs
          defaultValue="active"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="active">{t("active")}</TabsTrigger>
            <TabsTrigger value="archived">
              <Archive className="h-4 w-4 mr-2" />
              {t("archived")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1">
        <TodoList
          todos={todos}
          activeTab={activeTab}
          onToggleComplete={toggleComplete}
          onArchive={archiveTask}
          onRestore={restoreTask}
          onDelete={deleteTask}
          onUpdateText={updateTaskText}
          onUpdateDescription={updateDescription}
          onUpdatePriority={updatePriority}
          onOpenEtaDialog={openEtaDialog}
          selectedTasks={selectedTasks}
          onToggleSelection={toggleTaskSelection}
        />
      </div>

      {isAdding && activeTab === "active" && (
        <>
          <div className="mt-2 flex items-start gap-2 p-1">
            <textarea
              autoFocus
              ref={textareaRef}
              value={newTaskText}
              onChange={(e) => {
                setNewTaskText(e.target.value);
                // Auto-resize the textarea
                autoResizeTextarea(e.target);
              }}
              placeholder={t("enterTask")}
              className="flex-1 min-h-[36px] p-2 rounded-md border border-input bg-transparent text-sm resize-none overflow-hidden focus:outline-none focus:ring-1 focus:ring-ring"
              onKeyDown={(e) => {
                // Allow Enter to create a new line
                if (e.key === "Enter" && e.ctrlKey) {
                  e.preventDefault();
                  addTask(newTaskText);
                }
              }}
              rows={1}
            />
            <div className="flex gap-2">
              <Button
                disabled={!newTaskText}
                size="sm"
                onClick={() => addTask(newTaskText)}
              >
                {t("addTask")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsAdding(false)}
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-1 ml-2 mb-2 hidden md:block">
            Press Ctrl+Enter to save
          </div>
        </>
      )}

      {!isAdding && activeTab === "active" && (
        <div className="p-2 flex justify-center">
          <Button
            variant="ghost"
            className="text-primary w-full"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("addTask")}
          </Button>
        </div>
      )}

      {activeTab === "archived" && (
        <div className="p-2 flex justify-between items-center border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={selectAllArchivedTasks}
            className="text-muted-foreground"
          >
            {allArchivedSelected ? t("deselectAll") : t("selectAll")}
          </Button>

          {selectedTasks.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteSelectedTasks}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              {t("deleteSelected")} ({selectedTasks.length})
            </Button>
          )}
        </div>
      )}

      <TodoEtaDialog
        open={etaDialogOpen}
        onOpenChange={setEtaDialogOpen}
        initialDate={selectedEtaDate}
        onSave={updateEta}
      />
    </div>
  );
}
