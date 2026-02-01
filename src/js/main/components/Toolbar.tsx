import { useState, useRef, useEffect } from "react";

interface ToolbarProps {
  onCreate: () => void;
  onGenerate: (selectionOnly: boolean) => void;
  onLoadFile: () => void;
  isCreating: boolean;
  isGenerating: boolean;
}

export function Toolbar({
  onCreate,
  onGenerate,
  onLoadFile,
  isCreating,
  isGenerating,
}: ToolbarProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="toolbar">
      <button
        className="btn btn-primary"
        onClick={onCreate}
        disabled={isCreating || isGenerating}
      >
        {isCreating ? "Creating..." : "Create"}
      </button>

      <div className="dropdown" ref={dropdownRef}>
        <button
          className="btn btn-secondary"
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={isCreating || isGenerating}
        >
          {isGenerating ? "Reading..." : "Generate"}
          <span className="dropdown-arrow">&#9662;</span>
        </button>
        {showDropdown && (
          <div className="dropdown-menu">
            <button
              className="dropdown-item"
              onClick={() => {
                setShowDropdown(false);
                onGenerate(true);
              }}
            >
              From Selection
            </button>
            <button
              className="dropdown-item"
              onClick={() => {
                setShowDropdown(false);
                onGenerate(false);
              }}
            >
              Full Composition
            </button>
          </div>
        )}
      </div>

      <button
        className="btn btn-secondary"
        onClick={onLoadFile}
        disabled={isCreating || isGenerating}
      >
        Load File
      </button>
    </div>
  );
}
