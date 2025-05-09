"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/language-context";
import type { TodoItem } from "@/types/todo";
import { TodoItemComponent } from "./todo-item";

interface TodoListProps {
  todos: TodoItem[];
  activeTab: string;
  onToggleComplete: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateText: (id: string, text: string) => void;
  onUpdateDescription: (id: string, description: string) => void;
  onUpdatePriority: (id: string, priority: string) => void;
  onOpenEtaDialog: (id: string) => void;
  selectedTasks?: string[];
  onToggleSelection?: (id: string) => void;
}

export function TodoList({
  todos,
  activeTab,
  onToggleComplete,
  onArchive,
  onRestore,
  onDelete,
  onUpdateText,
  onUpdateDescription,
  onUpdatePriority,
  onOpenEtaDialog,
  selectedTasks = [],
  onToggleSelection = () => {},
}: TodoListProps) {
  const { t } = useLanguage();

  // Sort todos by priority (ascending)
  const sortedTodos = [...todos]
    .filter((todo) => (activeTab == "active" ? !todo.archived : todo.archived))
    .sort((a, b) => {
      // "-" priority should be at the bottom
      if (a.priority === "-") return 1;
      if (b.priority === "-") return -1;
      return Number(a.priority) - Number(b.priority);
    });

  const showSelection = activeTab === "archived";

  return (
    <ScrollArea className="min-h-[290px]">
      <div className="p-2">
        <table className="w-full table-fixed">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              {showSelection && <th className="w-8 text-center"></th>}
              <th title="Priority" className="w-8 text-center">
                P
              </th>
              <th
                className={`px-1 ${
                  showSelection ? "w-[calc(100%-96px)]" : "w-[calc(100%-80px)]"
                }`}
              >
                {t("taskName")}
              </th>
              <th className="w-16 text-right">{t("action")}</th>
            </tr>
          </thead>
          <tbody>
            {sortedTodos.map((todo) => (
              <TodoItemComponent
                key={todo.id}
                todo={todo}
                activeTab={activeTab}
                onToggleComplete={onToggleComplete}
                onArchive={onArchive}
                onRestore={onRestore}
                onDelete={onDelete}
                onUpdateText={onUpdateText}
                onUpdateDescription={onUpdateDescription}
                onUpdatePriority={onUpdatePriority}
                onOpenEtaDialog={onOpenEtaDialog}
                showSelection={showSelection}
                isSelected={selectedTasks.includes(todo.id)}
                onToggleSelection={() => onToggleSelection(todo.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </ScrollArea>
  );
}
