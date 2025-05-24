import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Common transport emojis
const TRANSPORT_EMOJIS = [
  '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', 
  '🛻', '🚚', '🚛', '🚜', '🚲', '🛵', '🏍️', '🛺', '🚔', '🚍', 
  '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', 
  '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬',
  '🛩️', '🛰️', '🚀', '🛸', '🚁', '⛵', '🚤', '🛥️', '🛳️', '⛴️',
  '🚢', '🛶', '🚧', '🚦', '🚥', '🚏', '🗿', '🗽', '🗼', '🏰'
];

interface EmojiPickerProps {
  selectedEmoji: string;
  onEmojiSelect: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ selectedEmoji, onEmojiSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-10 flex items-center justify-between px-3 text-left font-normal"
        >
          <span className="text-lg">{selectedEmoji}</span>
          <span className="ml-2 text-xs text-gray-500">Click to change</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Select an emoji</h4>
          <div className="grid grid-cols-8 gap-1">
            {TRANSPORT_EMOJIS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                className="h-8 w-8 p-0 text-lg"
                onClick={() => {
                  onEmojiSelect(emoji);
                  setIsOpen(false);
                }}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker; 