import React, { useState, useEffect, useRef } from 'react';
import { format, isSameDay, addMinutes } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

interface DateTimePickerProps {
  date: Date | undefined;
  time: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  date,
  time,
  onDateChange,
  onTimeChange,
}) => {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [hours, setHours] = useState<number>(12);
  const [minutes, setMinutes] = useState<number>(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('PM');
  const [timeError, setTimeError] = useState<string | null>(null);
  const timePickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  
  // For SSR compatibility
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Initialize time values from props
  useEffect(() => {
    if (time) {
      const [hoursStr, minutesStr] = time.split(':');
      let parsedHours = parseInt(hoursStr, 10);
      const parsedMinutes = parseInt(minutesStr, 10);
      
      // Determine if AM or PM
      let newPeriod: 'AM' | 'PM' = parsedHours >= 12 ? 'PM' : 'AM';
      
      // Convert 24-hour format to 12-hour format
      if (parsedHours > 12) {
        parsedHours -= 12;
      } else if (parsedHours === 0) {
        parsedHours = 12;
      }
      
      setHours(parsedHours);
      setMinutes(parsedMinutes);
      setPeriod(newPeriod);
    }
  }, [time]);
  
  // Validate time when date or time changes
  useEffect(() => {
    validateSelectedDateTime();
  }, [date, time]);

  // Auto-adjust time when date changes to ensure it's at least 4 hours in the future
  useEffect(() => {
    if (date) {
      const now = new Date();
      
      // If selected date is today, ensure time is at least 4 hours in the future
      if (isSameDay(date, now)) {
        const minBookingTime = new Date(now.getTime() + 4 * 60 * 60 * 1000);
        const [currentTimeHours, currentTimeMinutes] = time.split(':').map(Number);
        const minHours = minBookingTime.getHours();
        const minMinutes = minBookingTime.getMinutes();
        
        // Check if current time is less than minimum booking time
        if (currentTimeHours < minHours || (currentTimeHours === minHours && currentTimeMinutes < minMinutes)) {
          // Auto-adjust to minimum booking time
          const adjustedHours = minHours.toString().padStart(2, '0');
          const adjustedMinutes = minMinutes.toString().padStart(2, '0');
          onTimeChange(`${adjustedHours}:${adjustedMinutes}`);
        }
      }
    }
  }, [date]);
  
  // Validate that the selected date and time are in the future
  const validateSelectedDateTime = () => {
    setTimeError(null);
    
    if (!date) return;
    
    const now = new Date();
    
    // If selected date is today, check if time is at least 4 hours in the future
    if (isSameDay(date, now)) {
      // Convert selected time to 24-hour format for comparison
      const [timeHours, timeMinutes] = time.split(':').map(Number);
      
      // Calculate minimum booking time (4 hours from now)
      const minBookingTime = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      const minHours = minBookingTime.getHours();
      const minMinutes = minBookingTime.getMinutes();
      
      // Compare with minimum booking time
      if (timeHours < minHours || (timeHours === minHours && timeMinutes < minMinutes)) {
        setTimeError(`Bookings must be at least 4 hours in advance. Earliest time: ${format(minBookingTime, 'h:mm a')}`);
        
        // Auto-adjust to the minimum booking time
        const adjustedTime = new Date(minBookingTime);
        const adjustedHours = adjustedTime.getHours();
        const adjustedMinutes = adjustedTime.getMinutes();
        
        // Format in 24-hour format for the hidden input
        const formattedHours = adjustedHours.toString().padStart(2, '0');
        const formattedMinutes = adjustedMinutes.toString().padStart(2, '0');
        onTimeChange(`${formattedHours}:${formattedMinutes}`);
        
        // Update display values
        let display12Hour = adjustedHours;
        if (display12Hour > 12) {
          display12Hour -= 12;
        } else if (display12Hour === 0) {
          display12Hour = 12;
        }
        
        setHours(display12Hour);
        setMinutes(adjustedMinutes);
        setPeriod(adjustedHours >= 12 ? 'PM' : 'AM');
        
        toast.warning(`Booking time adjusted to ${format(adjustedTime, 'h:mm a')} (4 hours in advance)`);
      }
    } else if (date < now) {
      // If selected date is in the past, show error
      setTimeError("Cannot select a date in the past");
    }
  };
  
  // Update dropdown position when it's shown
  useEffect(() => {
    const updatePosition = () => {
      if (showTimePicker && buttonRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        
        // Calculate position
        let left = buttonRect.left + window.scrollX;
        let top = buttonRect.bottom + window.scrollY + 4;
        
        // Check if dropdown would go off the right edge of the screen
        const dropdownWidth = 200; // Reduced width
        if (left + dropdownWidth > window.innerWidth) {
          left = window.innerWidth - dropdownWidth - 10; // 10px margin
        }
        
        // Check if dropdown would go off the bottom of the screen
        const dropdownHeight = 230; // Approximate height
        if (top + dropdownHeight > window.innerHeight) {
          // Position above the button instead
          top = buttonRect.top - dropdownHeight - 4;
        }
        
        setDropdownPosition({ top, left });
      }
    };
    
    // Update position initially and on window resize
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [showTimePicker]);
  
  // Handle direct input changes
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    onTimeChange(newTime);
    
    // Update the UI state to match input
    if (newTime) {
      const [hoursStr, minutesStr] = newTime.split(':');
      const parsedHours = parseInt(hoursStr, 10);
      const parsedMinutes = parseInt(minutesStr, 10);
      
      if (!isNaN(parsedHours) && !isNaN(parsedMinutes)) {
        // Determine if AM or PM
        const newPeriod: 'AM' | 'PM' = parsedHours >= 12 ? 'PM' : 'AM';
        
        // Convert 24-hour format to 12-hour format
        let display12Hour = parsedHours;
        if (display12Hour > 12) {
          display12Hour -= 12;
        } else if (display12Hour === 0) {
          display12Hour = 12;
        }
        
        setHours(display12Hour);
        setMinutes(parsedMinutes);
        setPeriod(newPeriod);
      }
    }
    
    // Validate after change
    validateSelectedDateTime();
  };
  
  // Update time when hours/minutes/period change
  const updateTimeValue = (newHours: number, newMinutes: number, newPeriod: 'AM' | 'PM') => {
    // Convert to 24-hour format
    let hours24 = newHours;
    
    // Handle 12 AM (midnight) as 00:00
    if (newHours === 12 && newPeriod === 'AM') {
      hours24 = 0;
    }
    // Handle PM times
    else if (newPeriod === 'PM' && newHours !== 12) {
      hours24 += 12;
    }
    
    // Format the time value (ensuring leading zeros)
    const timeStr = `${hours24.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
    onTimeChange(timeStr);
    
    // Validate the new time
    validateSelectedDateTime();
  };
  
  // Increment/decrement handlers for time picker with event prevention
  const incrementHours = (e: React.MouseEvent) => {
    e.preventDefault();  // Prevent form submission
    e.stopPropagation(); // Stop event bubbling
    const newHours = hours === 12 ? 1 : hours + 1;
    setHours(newHours);
    updateTimeValue(newHours, minutes, period);
  };
  
  const decrementHours = (e: React.MouseEvent) => {
    e.preventDefault();  // Prevent form submission
    e.stopPropagation(); // Stop event bubbling
    const newHours = hours === 1 ? 12 : hours - 1;
    setHours(newHours);
    updateTimeValue(newHours, minutes, period);
  };
  
  const incrementMinutes = (e: React.MouseEvent) => {
    e.preventDefault();  // Prevent form submission
    e.stopPropagation(); // Stop event bubbling
    const newMinutes = (minutes + 15) % 60;
    setMinutes(newMinutes);
    updateTimeValue(hours, newMinutes, period);
  };
  
  const decrementMinutes = (e: React.MouseEvent) => {
    e.preventDefault();  // Prevent form submission
    e.stopPropagation(); // Stop event bubbling
    const newMinutes = (minutes - 15 + 60) % 60;
    setMinutes(newMinutes);
    updateTimeValue(hours, newMinutes, period);
  };
  
  const togglePeriod = (newPeriod: 'AM' | 'PM', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (period !== newPeriod) {
      setPeriod(newPeriod);
      updateTimeValue(hours, minutes, newPeriod);
    }
  };
  
  // Handle time button click - prevent form submission
  const handleTimeButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTimePicker(!showTimePicker);
  };
  
  // Handle done button click
  const handleDoneClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTimePicker(false);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timePickerRef.current && !timePickerRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowTimePicker(false);
      }
    };

    if (showTimePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTimePicker]);
  
  // Format the display time
  const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;

  // Create time picker dropdown portal
  const renderTimePickerDropdown = () => {
    if (!showTimePicker || !mounted) return null;

    // Find all dialog, modal, or popover elements
    const findHighestZIndex = () => {
      const elements = document.querySelectorAll('div[role="dialog"], .modal, .popover, [class*="z-"]');
      let highest = 9999; // Default high z-index
      
      elements.forEach(el => {
        const zIndex = parseInt(window.getComputedStyle(el).zIndex, 10);
        if (!isNaN(zIndex) && zIndex > highest) {
          highest = zIndex;
        }
      });
      
      return highest + 10; // Ensure our time picker is above the highest
    };
    
    // Get the highest z-index + 10 to ensure we're on top
    const zIndex = findHighestZIndex();
    
    return createPortal(
      <>
        {/* Semi-transparent backdrop to prevent clicks on dialog */}
        <div 
          className="fixed inset-0"
          style={{ zIndex: zIndex - 1 }}
          onClick={() => setShowTimePicker(false)}
        />
        
        {/* Time picker */}
        <div 
          ref={timePickerRef}
          className="fixed shadow-md rounded-md border border-gray-200 bg-white p-3 w-[200px]" 
          style={{
            top: `${dropdownPosition.top}px`, 
            left: `${dropdownPosition.left}px`,
            zIndex: zIndex
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="text-[10px] text-gray-500 font-medium mb-1.5 text-center">Select Time</div>
          <div className="grid grid-cols-3 gap-2 items-center text-center">
            {/* Hours */}
            <div className="flex flex-col items-center">
              <div className="text-[9px] text-gray-500 mb-0.5">Hours</div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 hover:bg-gray-100 hover:text-fleet-red rounded-full" 
                onClick={incrementHours}
                type="button"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <div className="text-base font-semibold my-1 min-w-[36px] bg-gray-50 py-0.5 px-1.5 rounded-md border border-gray-100">{hours}</div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 hover:bg-gray-100 hover:text-fleet-red rounded-full" 
                onClick={decrementHours}
                type="button"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="text-base font-bold mt-3">:</div>
            
            {/* Minutes */}
            <div className="flex flex-col items-center">
              <div className="text-[9px] text-gray-500 mb-0.5">Minutes</div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 hover:bg-gray-100 hover:text-fleet-red rounded-full" 
                onClick={incrementMinutes}
                type="button"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <div className="text-base font-semibold my-1 min-w-[36px] bg-gray-50 py-0.5 px-1.5 rounded-md border border-gray-100">
                {minutes.toString().padStart(2, '0')}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 hover:bg-gray-100 hover:text-fleet-red rounded-full" 
                onClick={decrementMinutes}
                type="button"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
            
            {/* AM/PM toggle */}
            <div className="col-span-3 mt-2 flex justify-center">
              <div className="p-0.5 rounded-md bg-gray-100 flex w-full shadow-sm">
                <Button 
                  variant={period === 'AM' ? 'default' : 'ghost'} 
                  size="sm"
                  className={`w-1/2 h-6 text-xs ${period === 'AM' ? 'bg-white shadow-sm text-fleet-red font-medium' : 'hover:bg-gray-50'}`}
                  onClick={(e) => togglePeriod('AM', e)}
                  type="button"
                >
                  AM
                </Button>
                <Button 
                  variant={period === 'PM' ? 'default' : 'ghost'} 
                  size="sm"
                  className={`w-1/2 h-6 text-xs ${period === 'PM' ? 'bg-white shadow-sm text-fleet-red font-medium' : 'hover:bg-gray-50'}`}
                  onClick={(e) => togglePeriod('PM', e)}
                  type="button"
                >
                  PM
                </Button>
              </div>
            </div>
            
            {/* Done button */}
            <div className="col-span-3 mt-2">
              <Button 
                className="w-full h-7 bg-fleet-red hover:bg-fleet-red/90 transition-colors shadow-md text-xs"
                onClick={handleDoneClick}
                type="button"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      </>,
      document.body
    );
  };

  return (
    <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
      <label className="text-xs font-medium text-gray-700">Date & Time</label>
      <div className="flex flex-col sm:flex-row gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className="w-full h-9 justify-start text-left text-sm font-normal py-1 border-gray-300 hover:border-fleet-red/30 transition-colors group"
              type="button" // Explicitly set to button type
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-gray-500 group-hover:text-fleet-red" />
              {date ? (
                <span className="text-gray-700">{format(date, "PPP")}</span>
              ) : (
                <span className="text-gray-400">Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-gray-200 shadow-md">
            <Calendar
              mode="single"
              selected={date}
              onSelect={onDateChange}
              initialFocus
              disabled={(date) => {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                return date < today;
              }}
              className="rounded-md border-0"
            />
          </PopoverContent>
        </Popover>
        
        <div className="relative">
          <Button
            ref={buttonRef}
            type="button" // Explicitly set to button type
            variant="outline"
            onClick={handleTimeButtonClick}
            className={`h-9 w-full sm:w-36 text-left font-normal justify-start pl-7 text-sm border-gray-300 hover:border-fleet-red/30 transition-colors overflow-hidden group ${timeError ? 'border-red-300 bg-red-50' : ''}`}
          >
            <Clock className={`absolute left-2 top-2.5 h-3.5 w-3.5 ${timeError ? 'text-red-500' : 'text-gray-500 group-hover:text-fleet-red'} pointer-events-none`} />
            <span className={timeError ? 'text-red-600' : 'text-gray-700'}>{formattedTime}</span>
          </Button>
          
          {/* Render time picker dropdown via portal */}
          {renderTimePickerDropdown()}
          
          {/* Hidden input to ensure form submission works */}
          <Input
            type="time"
            name="time"
            value={time}
            onChange={handleTimeChange}
            className="sr-only"
            required
          />
          
          {/* Error message */}
          {timeError && (
            <div className="absolute -bottom-5 left-0 right-0 text-xs text-red-500 flex items-center mt-1">
              <AlertCircle className="h-3 w-3 mr-1" />
              {timeError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DateTimePicker; 