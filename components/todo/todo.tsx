"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Archive, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useStorage } from "@/contexts/storage-context";
import type { TodoItem } from "@/types/todo";
import { TodoList } from "./todo-list";
import { TodoForm } from "./todo-form";
import { TodoEtaDialog } from "./todo-eta-dialog";
import { TodoSearch } from "./todo-search";
import { getRandomJokes } from "@/data/jokes";

export function Todo() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("active");
  const [etaDialogOpen, setEtaDialogOpen] = useState<boolean>(false);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [selectedEtaDate, setSelectedEtaDate] = useState<Date>(new Date());
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [filteredTodos, setFilteredTodos] = useState<TodoItem[]>([]);
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

  // Save and restore selected tasks when changing tabs
  useEffect(() => {
    const saveSelectedTasks = async () => {
      if (!isStorageReady) return;
      try {
        await setItem(`todoSelectedTasks_${activeTab}`, selectedTasks);
      } catch (error) {
        console.error("Error saving selected tasks:", error);
      }
    };
    saveSelectedTasks();
  }, [selectedTasks, activeTab, isStorageReady, setItem]);
  
  // Load selected tasks when changing tabs
  useEffect(() => {
    const loadSelectedTasks = async () => {
      if (!isStorageReady) return;
      try {
        const savedTasks = await getItem(`todoSelectedTasks_${activeTab}`);
        if (savedTasks && Array.isArray(savedTasks)) {
          setSelectedTasks(savedTasks);
        } else {
          setSelectedTasks([]);
        }
      } catch (error) {
        console.error("Error loading selected tasks:", error);
        setSelectedTasks([]);
      }
    };
    loadSelectedTasks();
  }, [activeTab, isStorageReady, getItem]);
  
  // Filter todos based on search term and priority filter
  const filterTodos = useCallback(() => {
    if (!todos) return [];
    
    return todos.filter(todo => {
      // Filter by active/archived status
      const statusMatch = activeTab === "active" ? !todo.archived : todo.archived;
      if (!statusMatch) return false;
      
      // Filter by search term
      const searchMatch = searchTerm.trim() === '' || 
        todo.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        todo.description.toLowerCase().includes(searchTerm.toLowerCase());
      if (!searchMatch) return false;
      
      // Filter by priority
      const priorityMatch = priorityFilter === "all" || todo.priority === priorityFilter;
      if (!priorityMatch) return false;
      
      return true;
    });
  }, [todos, activeTab, searchTerm, priorityFilter]);
  
  // Update filtered todos when filters or todos change
  useEffect(() => {
    setFilteredTodos(filterTodos());
  }, [todos, activeTab, searchTerm, priorityFilter, filterTodos]);

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
      // Set creation timestamp to current time, not future time
      const currentTime = Date.now();

      const newTodo: TodoItem = {
        id: currentTime.toString(),
        text: text,
        description: "",
        completed: false,
        archived: false,
        priority: "-",
        createdAt: currentTime,
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
    
  // Handlers for search and filter
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);
  
  const handleFilterChange = useCallback((priority: string) => {
    setPriorityFilter(priority);
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
      
      <TodoSearch 
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        disabled={todos.length === 0}
      />

      <div className="flex-1">
        <TodoList
          todos={filteredTodos}
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
