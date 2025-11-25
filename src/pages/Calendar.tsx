import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CalendarEvent {
  id: string;
  type: 'task' | 'habit';
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  color?: string;
  icon?: string;
  completed?: boolean;
}

export default function Calendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);

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

  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  const renderMonthView = () => (
    <>
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
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(day);
              }}
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
                      draggable
                      onDragStart={() => handleDragStart(event)}
                      className="text-xs truncate mb-1 px-1 rounded cursor-move"
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
    </>
  );

  const handleDragStart = (event: CalendarEvent) => {
    setDraggedEvent(event);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (date: Date, timeSlot?: number) => {
    if (!draggedEvent || !user) return;

    const newDate = new Date(date);
    if (timeSlot !== undefined) {
      newDate.setHours(timeSlot, 0, 0, 0);
    }

    try {
      if (draggedEvent.type === 'task') {
        const { error } = await supabase
          .from('tasks')
          .update({ scheduled_on: newDate.toISOString() })
          .eq('id', draggedEvent.id.split('-')[0])
          .eq('user_id', user.id);

        if (error) throw error;
        toast.success('Task rescheduled successfully');
      }

      loadCalendarEvents();
    } catch (error) {
      toast.error('Failed to reschedule');
    }

    setDraggedEvent(null);
  };

  const handleTimeBlockUpdate = async (eventId: string, startTime: string, endTime: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          scheduled_on: startTime,
          time_estimate: Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)
        })
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Time block updated');
      loadCalendarEvents();
    } catch (error) {
      toast.error('Failed to update time block');
    }
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays();

    return (
      <div className="overflow-auto">
        <div className="grid grid-cols-8 min-w-[800px]">
          <div className="sticky left-0 bg-background z-10 border-r border-border">
            <div className="h-16 border-b border-border" />
            {timeSlots.map((hour) => (
              <div key={hour} className="h-20 border-b border-border p-2 text-sm text-muted-foreground">
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {weekDays.map((day, dayIndex) => {
            const dayEvents = getEventsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div 
                key={dayIndex} 
                className={`border-r border-border ${isToday ? 'bg-primary/5' : ''}`}
              >
                <div className="h-16 border-b border-border p-2 text-center">
                  <div className="text-sm font-semibold">{dayNames[day.getDay()]}</div>
                  <div className={`text-2xl ${isToday ? 'text-primary font-bold' : ''}`}>
                    {day.getDate()}
                  </div>
                </div>

                {timeSlots.map((hour) => (
                  <div
                    key={hour}
                    className="h-20 border-b border-border relative hover:bg-muted/50 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={(e) => {
                      e.preventDefault();
                      const dropDate = new Date(day);
                      handleDrop(dropDate, hour);
                    }}
                  >
                    {dayEvents
                      .filter((event) => {
                        if (!event.startTime) return false;
                        const eventHour = new Date(event.startTime).getHours();
                        return eventHour === hour;
                      })
                      .map((event) => {
                        const startTime = event.startTime ? new Date(event.startTime) : null;
                        const endTime = event.endTime ? new Date(event.endTime) : null;
                        const duration = startTime && endTime 
                          ? (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
                          : 1;
                        const heightPercent = Math.min(duration * 100, 400);

                        return (
                          <div
                            key={event.id}
                            draggable
                            onDragStart={() => handleDragStart(event)}
                            className="absolute left-1 right-1 rounded p-1 text-xs cursor-move hover:shadow-lg transition-shadow"
                            style={{
                              backgroundColor: event.color || '#8B5CF6',
                              color: 'white',
                              height: `${heightPercent}%`,
                              top: '0',
                            }}
                          >
                            <div className="font-semibold truncate flex items-center gap-1">
                              {event.icon} {event.title}
                            </div>
                            {startTime && (
                              <div className="text-[10px] opacity-90">
                                {startTime.toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'month' | 'week')}>
          <TabsList className="mb-4">
            <TabsTrigger value="month" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Month
            </TabsTrigger>
            <TabsTrigger value="week" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Week (Time Blocking)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="month">{renderMonthView()}</TabsContent>
          <TabsContent value="week">{renderWeekView()}</TabsContent>
        </Tabs>
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
