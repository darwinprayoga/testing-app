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
import { cloudUtils } from "@/utils/storage-utils";
import { useAuth } from "@/contexts/auth-context";
import { v4 as uuidv4 } from "uuid";

export default function Todo() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("active");
  const [etaDialogOpen, setEtaDialogOpen] = useState<boolean>(false);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [selectedEtaDate, setSelectedEtaDate] = useState<Date>(new Date());
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const { t, currentLanguage } = useLanguage();
  const { getItem, setItem, isStorageReady } = useStorage();
  const { thisUser, isCloud } = useAuth();

  const sortTodos = (todos: any[]) =>
    [...todos].sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  const initDatas = async (uid: string) => {
    const savedIsAdding = await getItem("todoIsAdding");
    const [todos, settings] = await Promise.all([
      cloudUtils.get("todos", uid),
      cloudUtils.get("settings", uid),
    ]);

    if (savedIsAdding) setIsAdding(savedIsAdding);
    setTodos(sortTodos(todos));
    const setting = settings[0];
    setActiveTab(setting.todoActiveTab);
  };

  const updateSetting = async (
    key: string,
    value: any,
    localSetter: (val: any) => void,
  ) => {
    if (thisUser && isCloud) {
      await cloudUtils.set(
        "settings",
        {
          uid: thisUser.id,
          [key]: value,
        },
        thisUser.id,
      );
    }
    localSetter(value);
  };

  const activeChange = async () => {
    const value = activeTab === "active" ? "archived" : "active";
    await updateSetting("todoActiveTab", value, setActiveTab);
  };

  const persist = useDebouncedCallback((key: string, value: any) => {
    if (isStorageReady) setItem(key, value);
  }, 300);

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

  useEffect(() => {
    if (thisUser && isCloud) {
      initDatas(thisUser.id);

      const subscription = cloudUtils.subscribe(
        "todos",
        thisUser.id,
        async () => {
          await initDatas(thisUser.id);
        },
      );

      return () => {
        cloudUtils.removeChannel(subscription);
      };
    } else {
      if (!isStorageReady) return;
      loadTodosFromStorage();
    }
  }, [isStorageReady, thisUser, isCloud]);

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
    let data: TodoItem[];

    const oneHourOneMinuteLater = Date.now() + (60 + 60 * 60) * 1000;

    const newTodo: TodoItem = {
      id: uuidv4(),
      text: text,
      description: "",
      completed: false,
      archived: false,
      priority: "-",
      createdAt: oneHourOneMinuteLater,
    };

    data = [...todos, newTodo];

    if (thisUser && isCloud) {
      await cloudUtils.set("todos", newTodo, thisUser.id);
    } else {
      setTodos(data);
      setTimeout(() => {
        persist("todos", data);
      }, 100);
    }

    setIsAdding(false);
    setNewTaskText("");
  };

  const toggleComplete = async (id: string) => {
    const targetTodo = todos.find((t) => t.id === id);
    if (!targetTodo) return;

    const updatedTodo = { ...targetTodo, completed: !targetTodo.completed };

    // Sync change with storage
    if (thisUser && isCloud) {
      await cloudUtils.set("todos", updatedTodo, thisUser.id);
    } else {
      // Update UI state immediately
      setTodos((prev) => prev.map((t) => (t.id === id ? updatedTodo : t)));
    }
  };

  const archiveTask = async (id: string) => {
    const targetTodo = todos.find((todo) => todo.id === id);
    if (!targetTodo) return;

    const updatedTodo = { ...targetTodo, archived: true };

    // Sync change with storage
    if (thisUser && isCloud) {
      await cloudUtils.set("todos", updatedTodo, thisUser.id);
    } else {
      // Update UI state immediately
      setTodos((prev) =>
        prev.map((todo) => (todo.id === id ? updatedTodo : todo)),
      );
    }
  };

  const deleteTask = async (id: string) => {
    const targetTodo = todos.find((todo) => todo.id === id);
    if (!targetTodo) return;

    if (thisUser && isCloud) {
      await cloudUtils.remove("todos", thisUser.id, id);
    }

    // Always update local state
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
    setSelectedTasks((prev) => prev.filter((taskId) => taskId !== id));
  };

  const deleteSelectedTasks = async () => {
    if (thisUser && isCloud) {
      const deletePromises = selectedTasks.map((id) =>
        cloudUtils.remove("todos", thisUser.id, id),
      );
      await Promise.all(deletePromises);
    }

    // Always update local state
    setTodos((prev) => prev.filter((todo) => !selectedTasks.includes(todo.id)));
    setSelectedTasks([]);
  };

  const restoreTask = async (id: string) => {
    const targetTodo = todos.find((todo) => todo.id === id);
    if (!targetTodo) return;

    const updatedTodo = { ...targetTodo, archived: false };

    // Sync change with storage
    if (thisUser && isCloud) {
      await cloudUtils.set("todos", updatedTodo, thisUser.id);
    }

    // Always update local state
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? updatedTodo : todo)),
    );
    setSelectedTasks((prev) => prev.filter((taskId) => taskId !== id));
  };

  const updateTaskText = async (id: string, text: string) => {
    const targetTodo = todos.find((todo) => todo.id === id);
    if (!targetTodo) return;

    const updatedTodo = { ...targetTodo, text };

    // Sync change with storage
    if (thisUser && isCloud) {
      await cloudUtils.set("todos", updatedTodo, thisUser.id);
    }

    // Always update local state
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? updatedTodo : todo)),
    );
  };

  const updateDescription = async (id: string, description: string) => {
    const targetTodo = todos.find((todo) => todo.id === id);
    if (!targetTodo) return;

    const updatedTodo = { ...targetTodo, description };

    // Sync change with storage
    if (thisUser && isCloud) {
      await cloudUtils.set("todos", updatedTodo, thisUser.id);
    }

    // Always update local state
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? updatedTodo : todo)),
    );
  };

  const updatePriority = async (id: string, priority: string) => {
    const targetTodo = todos.find((todo) => todo.id === id);
    if (!targetTodo) return;

    const updatedTodo = { ...targetTodo, priority };

    // Sync change with storage
    if (thisUser && isCloud) {
      await cloudUtils.set("todos", updatedTodo, thisUser.id);
    }

    // Always update local state
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? updatedTodo : todo)),
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

  const updateEta = async (date: Date) => {
    if (!selectedTodoId) return;

    const targetTodo = todos.find((todo) => todo.id === selectedTodoId);
    if (!targetTodo) return;

    const updatedTodo = { ...targetTodo, createdAt: date.getTime() };

    // Sync change with storage
    if (thisUser && isCloud) {
      await cloudUtils.set("todos", updatedTodo, thisUser.id);
    }

    // Always update local state and UI controls
    setTodos((prev) =>
      prev.map((todo) => (todo.id === selectedTodoId ? updatedTodo : todo)),
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
          onValueChange={activeChange}
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

      {activeTab === "active" && (
        <>
          {isAdding ? (
            <section>
              <div className="mt-2 flex items-start gap-2 p-1">
                <textarea
                  autoFocus
                  ref={textareaRef}
                  value={newTaskText}
                  onChange={(e) => {
                    setNewTaskText(e.target.value);
                    autoResizeTextarea(e.target);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) {
                      e.preventDefault();
                      addTask(newTaskText);
                    }
                  }}
                  placeholder={t("enterTask")}
                  className="flex-1 min-h-[36px] p-2 rounded-md border border-input bg-transparent text-sm resize-none overflow-hidden focus:outline-none focus:ring-1 focus:ring-ring"
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
              <p className="text-xs text-muted-foreground mt-1 ml-2 mb-2 hidden md:block">
                Press Ctrl+Enter to save
              </p>
            </section>
          ) : (
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
        </>
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
