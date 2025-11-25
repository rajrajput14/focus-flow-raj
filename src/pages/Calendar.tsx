import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CalendarEvent {
  id: string;
  type: 'task' | 'habit';
  title: string;
  date: Date;
  color?: string;
  icon?: string;
  completed?: boolean;
}

export default function Calendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      loadCalendarEvents();
    }
  }, [user, currentDate]);

  const loadCalendarEvents = async () => {
    if (!user) return;

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Load tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .gte('scheduled_on', startOfMonth.toISOString())
      .lte('scheduled_on', endOfMonth.toISOString());

    // Load habits
    const { data: habits } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id);

    const calendarEvents: CalendarEvent[] = [];

    // Add tasks
    tasks?.forEach((task) => {
      if (task.scheduled_on) {
        calendarEvents.push({
          id: task.id,
          type: 'task',
          title: task.title,
          date: new Date(task.scheduled_on),
          completed: task.status === 'done',
        });
      }
    });

    // Add habits (show on each day of the month)
    habits?.forEach((habit) => {
      const daysInMonth = endOfMonth.getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        calendarEvents.push({
          id: `${habit.id}-${day}`,
          type: 'habit',
          title: habit.title,
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), day),
          color: habit.color,
          icon: habit.icon,
        });
      }
    });

    setEvents(calendarEvents);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
    );
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold gradient-text">Calendar</h1>
          <p className="text-muted-foreground">Plan your tasks and track habits</p>
        </div>
      </motion.div>

      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center font-semibold text-sm text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {getDaysInMonth().map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dayEvents = getEventsForDate(day);
            const isToday =
              day.getDate() === new Date().getDate() &&
              day.getMonth() === new Date().getMonth() &&
              day.getFullYear() === new Date().getFullYear();

            return (
              <motion.div
                key={day.toISOString()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.01 }}
                onClick={() => setSelectedDate(day)}
                className={`aspect-square p-2 rounded-xl border-2 cursor-pointer transition-all hover:border-primary ${
                  isToday ? 'border-primary bg-primary/10' : 'border-border bg-card'
                } ${selectedDate?.toDateString() === day.toDateString() ? 'ring-2 ring-primary' : ''}`}
              >
                <div className="flex flex-col h-full">
                  <span className="text-sm font-semibold mb-1">{day.getDate()}</span>
                  <div className="flex-1 overflow-hidden">
                    {dayEvents.slice(0, 3).map((event, i) => (
                      <div
                        key={event.id}
                        className="text-xs truncate mb-1 px-1 rounded"
                        style={{
                          backgroundColor: event.color || '#8B5CF6',
                          color: 'white',
                        }}
                      >
                        {event.icon} {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {selectedDate && (
        <Card className="glass-card p-6">
          <h3 className="text-xl font-bold mb-4">
            Events on {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          <div className="space-y-3">
            {getEventsForDate(selectedDate).map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl"
                  style={{ backgroundColor: event.color || '#8B5CF6' }}
                >
                  {event.icon || (event.type === 'task' ? '✓' : '🎯')}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{event.title}</p>
                  <p className="text-sm text-muted-foreground capitalize">{event.type}</p>
                </div>
                {event.completed && (
                  <div className="text-green-500 font-semibold">✓ Done</div>
                )}
              </div>
            ))}
            {getEventsForDate(selectedDate).length === 0 && (
              <p className="text-center text-muted-foreground py-8">No events scheduled for this day</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
