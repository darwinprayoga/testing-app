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

export function Todo() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("active");
  const [etaDialogOpen, setEtaDialogOpen] = useState<boolean>(false);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [selectedEtaDate, setSelectedEtaDate] = useState<Date>(new Date());
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const { t, currentLanguage } = useLanguage();
  const { getItem, setItem, isStorageReady } = useStorage();

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
        const savedTodos = await getItem("todos");
        if (Array.isArray(savedTodos)) {
          setTodos(savedTodos);
        } else {
          loadDummyData();
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
  }, [isStorageReady, currentLanguage, getItem]);

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
          console.log("Dummy todos saved to storage:", dummyTodos.length);
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
        inputElement.focus();
      }, 100);
    }
  }, [isAdding]);

  const addTask = async (text: string) => {
    let data: TodoItem[];

    const oneHourOneMinuteLater = Date.now() + (60 + 60 * 60) * 1000;

    const newTodo: TodoItem = {
      id: (todos.length + 1).toString(), // better than length-based ID
      text: text,
      description: "",
      completed: false,
      archived: false,
      priority: "-",
      createdAt: oneHourOneMinuteLater,
    };

    data = [...todos, newTodo];

    if (Array.isArray(data)) {
      setTodos(data);
      setTimeout(() => {
        persist("todos", data);
        console.log(data);
      }, 100);
    }

    setIsAdding(false);
    setNewTaskText("");
  };

  const toggleComplete = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  const archiveTask = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, archived: true } : todo,
      ),
    );
  };

  const deleteTask = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
    setSelectedTasks(selectedTasks.filter((taskId) => taskId !== id));
  };

  const deleteSelectedTasks = () => {
    setTodos(todos.filter((todo) => !selectedTasks.includes(todo.id)));
    setSelectedTasks([]);
  };

  const restoreTask = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, archived: false } : todo,
      ),
    );
    setSelectedTasks(selectedTasks.filter((taskId) => taskId !== id));
  };

  const updateTaskText = (id: string, text: string) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, text } : todo)));
  };

  const updateDescription = (id: string, description: string) => {
    setTodos(
      todos.map((todo) => (todo.id === id ? { ...todo, description } : todo)),
    );
  };

  const updatePriority = (id: string, priority: string) => {
    setTodos(
      todos.map((todo) => (todo.id === id ? { ...todo, priority } : todo)),
    );
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
    setTodos(
      todos.map((todo) =>
        todo.id === selectedTodoId
          ? { ...todo, createdAt: date.getTime() }
          : todo,
      ),
    );
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
