"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Archive, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useStorage } from "@/contexts/storage-context";
import type { TodoItem } from "@/types/todo";
import { TodoList } from "./todo-list";
import { TodoForm } from "./todo-form";
import { TodoEtaDialog } from "./todo-eta-dialog";
import { getRandomJokes } from "@/data/jokes";

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

  useEffect(() => {
    if (!isStorageReady) return;

    const loadTodosFromStorage = async () => {
      try {
        const savedTodos = await getItem("todos");
        if (savedTodos) {
          try {
            // Ensure todos are in a valid format and have the new fields
            if (Array.isArray(savedTodos) && savedTodos.length > 0) {
              const updatedTodos = savedTodos.map((todo: any) => ({
                ...todo,
                priority: todo.priority || "-",
                description: todo.description || "",
                createdAt: todo.createdAt || Date.now(),
              }));
              setTodos(updatedTodos);
            } else {
              loadDummyData();
            }
          } catch (error) {
            console.error("Error parsing todos:", error);
            loadDummyData();
          }
        } else {
          loadDummyData();
        }

        // Load additional states like active tab and adding state
        const savedActiveTab = await getItem("todoActiveTab");
        if (savedActiveTab) setActiveTab(savedActiveTab);

        const savedIsAdding = await getItem("todoIsAdding");
        if (savedIsAdding) setIsAdding(savedIsAdding === "true");
      } catch (error) {
        console.error("Error during initialization:", error);
        loadDummyData();
      }
    };

    loadTodosFromStorage();
  }, [isStorageReady, currentLanguage, getItem, setItem]);

  // Clear selected tasks when changing tabs
  useEffect(() => {
    setSelectedTasks([]);
  }, [activeTab]);

  // Helper function to load dummy data
  const loadDummyData = () => {
    // Get culturally relevant jokes for the current language
    const jokeItems = getRandomJokes(currentLanguage, "todo", 4);

    // Set dummy data with jokes if no todos exist
    const dummyTodos = jokeItems.map((joke, index) => ({
      id: (index + 1).toString(),
      text: joke.text || "Lorem ipsum dolor sit amet",
      description: joke.description || "",
      completed: index < 2, // First two are completed
      archived: index === 3, // Last one is archived
      priority: joke.priority || (index + 1).toString(),
      createdAt: Date.now() - 86400000 / (index + 1), // Staggered timestamps
    }));

    setTodos(dummyTodos);

    // Ensure storage is ready before saving
    if (isStorageReady) {
      try {
        setItem("todos", dummyTodos);
        console.log("Dummy todos saved to storage:", dummyTodos.length);
      } catch (error) {
        console.error("Error saving dummy todos to storage:", error);
      }
    } else {
      console.warn("Storage not ready, dummy todos not saved");
    }
  };

  // Save todos to storage whenever they change
  useEffect(() => {
    if (!isStorageReady) return;

    try {
      // Ensure todos is an array before saving
      if (Array.isArray(todos)) {
        setItem("todos", todos);
        console.log("Todos saved to storage:", todos.length);
      } else {
        console.error("Cannot save todos: not an array", todos);
      }
    } catch (error) {
      console.error("Error saving todos to storage:", error);
    }
  }, [todos, isStorageReady, setItem]);

  // Save active tab state whenever it changes
  useEffect(() => {
    if (!isStorageReady) return;
    setItem("todoActiveTab", activeTab);
  }, [activeTab, isStorageReady, setItem]);

  // Save adding state whenever it changes
  useEffect(() => {
    if (!isStorageReady) return;
    setItem("todoIsAdding", isAdding.toString());
  }, [isAdding, isStorageReady, setItem]);

  // Add a new task
  const addTask = (text: string) => {
    if (text.trim()) {
      const oneHourOneMinuteLater = Date.now() + (60 + 60 * 60) * 1000;

      const newTodo: TodoItem = {
        id: Date.now().toString(),
        text: text,
        description: "",
        completed: false,
        archived: false,
        priority: "-",
        createdAt: oneHourOneMinuteLater,
      };
      setTodos([...todos, newTodo]);
      setIsAdding(false);
    }
  };

  // Toggle task completion
  const toggleComplete = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  // Archive a task
  const archiveTask = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, archived: true } : todo,
      ),
    );
  };

  // Delete a task
  const deleteTask = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
    // Remove from selected tasks if it was selected
    setSelectedTasks(selectedTasks.filter((taskId) => taskId !== id));
  };

  // Delete multiple tasks
  const deleteSelectedTasks = () => {
    setTodos(todos.filter((todo) => !selectedTasks.includes(todo.id)));
    setSelectedTasks([]);
  };

  // Restore an archived task
  const restoreTask = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, archived: false } : todo,
      ),
    );
    // Remove from selected tasks if it was selected
    setSelectedTasks(selectedTasks.filter((taskId) => taskId !== id));
  };

  // Update task text
  const updateTaskText = (id: string, text: string) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, text } : todo)));
  };

  // Update task description
  const updateDescription = (id: string, description: string) => {
    setTodos(
      todos.map((todo) => (todo.id === id ? { ...todo, description } : todo)),
    );
  };

  // Update task priority
  const updatePriority = (id: string, priority: string) => {
    setTodos(
      todos.map((todo) => (todo.id === id ? { ...todo, priority } : todo)),
    );
  };

  // Open ETA dialog for a task
  const openEtaDialog = (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (todo) {
      setSelectedTodoId(id);
      setSelectedEtaDate(new Date(todo.createdAt));
      setEtaDialogOpen(true);
    }
  };

  // Update task ETA
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

  // Toggle task selection
  const toggleTaskSelection = (id: string) => {
    setSelectedTasks((prev) =>
      prev.includes(id)
        ? prev.filter((taskId) => taskId !== id)
        : [...prev, id],
    );
  };

  // Select all archived tasks
  const selectAllArchivedTasks = () => {
    const archivedTaskIds = todos
      .filter((todo) => todo.archived)
      .map((todo) => todo.id);

    if (selectedTasks.length === archivedTaskIds.length) {
      // If all are selected, deselect all
      setSelectedTasks([]);
    } else {
      // Otherwise select all
      setSelectedTasks(archivedTaskIds);
    }
  };

  // Get archived tasks count
  const archivedTasksCount = todos.filter((todo) => todo.archived).length;
  const allArchivedSelected =
    archivedTasksCount > 0 && selectedTasks.length === archivedTasksCount;

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

      {isAdding && (
        <>
          <TodoForm onAddTask={addTask} onCancel={() => setIsAdding(false)} />
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

      {/* ETA Dialog */}
      <TodoEtaDialog
        open={etaDialogOpen}
        onOpenChange={setEtaDialogOpen}
        initialDate={selectedEtaDate}
        onSave={updateEta}
      />
    </div>
  );
}
