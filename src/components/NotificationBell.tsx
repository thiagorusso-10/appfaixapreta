"use client";

import { useState } from "react";
import { Bell, FileText, CheckCircle2, Ticket, AlertTriangle, MessageCircle } from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiMock } from "@/lib/mockData";
import { useAcademy } from "@/contexts/AcademyThemeContext";
import { useUser } from "@clerk/nextjs";

export function NotificationBell() {
  const { academy } = useAcademy();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  if (!academy) return null;

  const allStudents = apiMock.getStudentsByAcademy(academy.id);
  const student = user?.primaryEmailAddress?.emailAddress 
    ? allStudents.find(s => s.email === user.primaryEmailAddress!.emailAddress) || allStudents[0]
    : allStudents.find(s => s.id === "s1"); // Fallback debug s1

  // Mocked runtime mutating state (since we don't have a real DB push)
  const [notifications, setNotifications] = useState(() => 
     student ? apiMock.getNotificationsByStudent(student.id) : []
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({...n, read: true})));
    // Real implementation would send an API PATCH call here
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "PAYMENT": return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "EVENT": return <Ticket className="h-4 w-4 text-primary" />;
      default: return <MessageCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  if (!student) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger className="relative group hover:bg-muted/50 transition-all rounded-full h-11 w-11 flex items-center justify-center">
          <Bell className="h-[22px] w-[22px] text-muted-foreground group-hover:text-foreground transition-all duration-300" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white shadow-sm ring-2 ring-background animate-in zoom-in">
              {unreadCount}
            </span>
          )}
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0 mr-4 mt-2 shadow-xl border-border/40 rounded-2xl glass-card overflow-hidden" align="end">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/50">
          <div className="font-semibold text-sm">Notificações</div>
          {unreadCount > 0 && (
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs h-7 text-muted-foreground hover:text-primary px-2"
            >
              Marcar como lidas
            </Button>
          )}
        </div>
        
        <div className="max-h-[350px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Tudo tranquilo!</p>
              <p className="text-xs text-muted-foreground/70">Você não tem novas mensagens.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`flex gap-3 p-4 border-b border-border/30 transition-colors hover:bg-muted/40 ${!notif.read ? 'bg-primary/5' : ''}`}
                >
                  <div className={`mt-0.5 rounded-full p-2 h-8 w-8 flex items-center justify-center shrink-0 ${!notif.read ? 'bg-background shadow-xs' : 'bg-muted/50'}`}>
                    {getIconForType(notif.type)}
                  </div>
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex items-start justify-between">
                      <h4 className={`text-sm ${!notif.read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                        {notif.title}
                      </h4>
                      {!notif.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {notif.description}
                    </p>
                    <span className="text-[10px] text-muted-foreground/70 font-medium">
                      {new Date(notif.timestamp).toLocaleDateString('pt-BR')} às {new Date(notif.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
