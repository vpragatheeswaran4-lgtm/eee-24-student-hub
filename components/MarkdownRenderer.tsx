import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Split by code blocks first to isolate them from other markdown processing.
  const parts = content.split(/(```[\s\S]*?```)/g);

  const renderText = (text: string) => {
    // Process inline markdown like bold, italic, and inline code.
    const segments = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return segments.map((segment, i) => {
        if (segment.startsWith('**') && segment.endsWith('**')) {
            return <strong key={i}>{segment.slice(2, -2)}</strong>;
        }
        if (segment.startsWith('*') && segment.endsWith('*')) {
            return <em key={i}>{segment.slice(1, -1)}</em>;
        }
        if (segment.startsWith('`') && segment.endsWith('`')) {
            return <code key={i} className="bg-gray-300 dark:bg-gray-600 rounded px-1 py-0.5 text-xs font-mono">{segment.slice(1, -1)}</code>;
        }
        return segment;
    });
  }

  return (
    <div className="text-sm space-y-2">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // Render code blocks
          const code = part.slice(3, -3).trim();
          return (
            <pre key={index} className="bg-gray-800 dark:bg-black text-white p-3 my-2 rounded-md text-sm font-mono overflow-x-auto">
              <code>{code}</code>
            </pre>
          );
        } else {
          // Render regular text, processing line by line for lists or paragraphs
          return part.trim().split('\n').map((line, lineIndex) => {
            if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
                // Render list items with a visual bullet point
                return (
                    <div key={`${index}-${lineIndex}`} className="flex items-start">
                        <span className="mr-2 mt-1">•</span>
                        <p className="flex-1">{renderText(line.trim().substring(2))}</p>
                    </div>
                );
            }
            // Filter out empty lines
            if (!line.trim()) return null;

            // Render as a paragraph
            return <p key={`${index}-${lineIndex}`}>{renderText(line)}</p>;
          }).filter(Boolean); // Remove any null entries from empty lines
        }
      })}
    </div>
  );
};

export default MarkdownRenderer;
