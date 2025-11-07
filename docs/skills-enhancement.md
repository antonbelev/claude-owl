# Skills Manager Enhancements

## Overview

We've enhanced the Skills Manager with two critical improvements:
1. **File Upload Capability** - Upload skill .md files with automatic validation
2. **Unsaved Changes Protection** - Prevent accidental data loss in forms

## Features

### 1. File Upload with Validation

Users can now upload skill markdown files directly into the creation form. The system automatically:

- **Validates file structure** - Ensures proper YAML frontmatter format
- **Parses frontmatter** - Extracts name, description, and allowed-tools
- **Validates required fields** - Checks for name, description, and proper formatting
- **Displays warnings** - Shows non-critical issues (empty content, no tools restriction)
- **Auto-fills form** - Populates all form fields with parsed data

#### File Format Requirements

```markdown
---
name: skill-name
description: Brief description of what the skill does
allowed-tools:
  - Tool1
  - Tool2
---

# Skill Content

Detailed instructions for the skill...
```

#### Validation Rules

**Required Fields:**
- `name` - Must be lowercase with hyphens (e.g., `my-skill-name`), max 64 chars
- `description` - Max 1024 characters

**Optional Fields:**
- `allowed-tools` - Array of tool names

**Validation Errors** (prevent upload):
- Missing frontmatter delimiters (`---`)
- Invalid YAML syntax
- Missing required fields (name, description)
- Invalid name format
- Field length violations

**Validation Warnings** (allow upload):
- Empty skill content
- No tools restriction (access to all tools)

### 2. Unsaved Changes Protection

The modal now tracks user input and prevents accidental data loss:

#### Features

- **Auto-detection** - Tracks when user enters any data
- **Click-outside protection** - Modal doesn't close when clicking overlay if changes exist
- **Close button protection** - Shows confirmation dialog when closing with unsaved data
- **Confirmation dialog** - Clear options: "Keep Editing" or "Discard Changes"
- **Smart reset** - Clears unsaved state after successful save

#### User Flow

1. User starts typing in any form field → Changes detected
2. User clicks outside modal or close button → Confirmation dialog appears
3. User chooses:
   - **Keep Editing** - Returns to form, data preserved
   - **Discard Changes** - Closes modal, data lost
4. User submits form → Changes saved, modal closes without confirmation

### 3. UI Enhancements

#### File Upload Section

- Prominent file upload button with file icon (📁)
- Clear instructions: "Upload a skill markdown file to auto-fill the form"
- Visual separation with "Or create manually" divider
- Dashed border design to indicate drag-and-drop area (visual only)

#### Error/Warning Display

- **Errors** - Red background, prevents form submission
- **Warnings** - Yellow background, allows form submission
- Multi-line error support for detailed feedback

#### Confirmation Dialog

- Overlay with higher z-index (appears above main modal)
- Clear warning message
- Action buttons with appropriate colors:
  - "Keep Editing" (Secondary - gray)
  - "Discard Changes" (Danger - red)

## Implementation Details

### New Utilities

#### `markdown.utils.ts`

```typescript
// Parse markdown with YAML frontmatter
parseMarkdownWithFrontmatter<T>(markdown: string): ParsedMarkdown<T>

// Validate skill markdown structure
validateSkillMarkdown(markdown: string): SkillValidationResult

// Convert skill data to markdown
skillToMarkdown(name, description, content, allowedTools?): string
```

**Simple YAML Parser:**
- Handles key-value pairs
- Supports arrays (with `-` prefix)
- Handles strings, numbers, booleans
- Supports comments (`#`)
- No external dependencies

### Component Changes

#### `SkillsManager.tsx`

**New State:**
- `validationWarnings: string[]` - Stores non-critical validation issues
- `hasUnsavedChanges: boolean` - Tracks if user has entered data
- `showCloseConfirm: boolean` - Controls confirmation dialog visibility

**New Handlers:**
- `handleFileUpload()` - Processes uploaded file, validates, parses, and populates form
- `handleClose()` - Checks for unsaved changes before closing
- `handleConfirmClose()` - Confirms user wants to discard changes
- `handleCancelClose()` - Cancels close operation
- `handleOverlayClick()` - Only closes if clicked on overlay (not content)

**useEffect Hook:**
- Monitors all form fields for changes
- Updates `hasUnsavedChanges` state automatically

### CSS Additions

**File Upload:**
- `.file-upload-group` - Container with dashed border
- `.file-upload-label` - Styled button for file selection
- `.file-input` - Hidden actual input element

**Warnings:**
- `.form-warning` - Yellow background with warning text

**Divider:**
- `.form-divider` - Visual separator with centered text

**Confirmation Dialog:**
- `.confirm-overlay` - Higher z-index overlay
- `.modal-confirm` - Smaller modal for confirmation
- `.confirm-body` - Dialog content styling

## Usage Examples

### Example 1: Upload Valid Skill File

1. Click "Create Skill" button
2. Click "📁 Choose .md file" button
3. Select `example-skill.md`
4. Form auto-fills with:
   - Name: `code-reviewer`
   - Description: `Review code for best practices...`
   - Content: Full markdown content
   - Allowed Tools: `Read, Grep, Glob`
5. Adjust if needed and submit

### Example 2: Upload Invalid Skill File

If file is missing required fields or has syntax errors:

```
Invalid skill file:
Frontmatter missing required field: name
Skill name must be lowercase with hyphens
```

User can fix the file and try again.

### Example 3: Unsaved Changes

1. User starts typing skill name
2. User accidentally clicks outside modal
3. Dialog appears: "You have unsaved changes..."
4. User clicks "Keep Editing"
5. Returns to form with all data intact

## Testing

### Manual Test Cases

**File Upload:**
- [ ] Upload valid .md file → Form populated correctly
- [ ] Upload file without frontmatter → Error shown
- [ ] Upload file with invalid YAML → Error shown
- [ ] Upload file with missing name → Error shown
- [ ] Upload file with invalid name format → Error shown
- [ ] Upload .txt file → Error: "Please upload a Markdown (.md) file"
- [ ] Upload file with warnings → Warnings shown, form populated

**Unsaved Changes:**
- [ ] Type in any field → Changes detected
- [ ] Click outside modal → Confirmation shown
- [ ] Click "Keep Editing" → Returns to form
- [ ] Click "Discard Changes" → Modal closes
- [ ] Submit form → Modal closes without confirmation
- [ ] Empty form, click outside → Closes immediately (no confirmation)

**Integration:**
- [ ] Upload file, modify, click outside → Confirmation shown
- [ ] Upload file, submit → Skill created successfully
- [ ] Upload file, discard → No skill created

## Future Enhancements

1. **Drag & Drop** - Allow dragging .md files onto upload area
2. **File Preview** - Show preview of uploaded file before parsing
3. **Export Skill** - Download created skill as .md file
4. **Template Library** - Quick-select common skill templates
5. **Syntax Highlighting** - Highlight markdown syntax in content field
6. **Live Preview** - Show rendered markdown as user types
7. **Supporting Files** - Upload multiple files for skill package
8. **Version Control** - Track skill modifications over time

## Best Practices

### For Users

1. **Use valid skill files** - Follow the required format
2. **Test uploaded skills** - Verify they work as expected
3. **Add detailed instructions** - Help Claude understand when to use the skill
4. **Restrict tools when possible** - Limit skill to necessary tools only

### For Developers

1. **Validate early** - Check file format before processing
2. **Show clear errors** - Help users understand what went wrong
3. **Preserve user data** - Always confirm before discarding changes
4. **Provide examples** - Include example skill files in documentation

## Example Skill File

See `docs/example-skill.md` for a complete example of a properly formatted skill file.
