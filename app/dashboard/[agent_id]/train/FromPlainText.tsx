// components/FromPlainText.tsx
'use client'

import { useState, useEffect } from 'react'
import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Bold, Italic, List, ListOrdered, Heading1, Heading2, Pilcrow,
  Code, Minus, Redo, Undo, Strikethrough, Code2,
} from 'lucide-react'
import { FileData } from './FromFile' 




const TiptapToolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b rounded-t-md bg-muted">
      {/* Undo/Redo */}
      <Button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} variant="ghost" size="icon" title="Undo">
        <Undo className="h-4 w-4" />
      </Button>
      <Button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} variant="ghost" size="icon" title="Redo">
        <Redo className="h-4 w-4" />
      </Button>
      {/* Text Formatting */}
      <Button onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().toggleBold()} variant={editor.isActive('bold') ? 'secondary' : 'ghost'} size="icon" title="Bold">
        <Bold className="h-4 w-4" />
      </Button>
      <Button onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().toggleItalic()} variant={editor.isActive('italic') ? 'secondary' : 'ghost'} size="icon" title="Italic">
        <Italic className="h-4 w-4" />
      </Button>
      <Button onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().toggleStrike()} variant={editor.isActive('strike') ? 'secondary' : 'ghost'} size="icon" title="Strikethrough">
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button onClick={() => editor.chain().focus().toggleCode().run()} disabled={!editor.can().toggleCode()} variant={editor.isActive('code') ? 'secondary' : 'ghost'} size="icon" title="Inline Code">
        <Code2 className="h-4 w-4" />
      </Button>
      {/* Block Types */}
      <Button onClick={() => editor.chain().focus().setParagraph().run()} variant={editor.isActive('paragraph') ? 'secondary' : 'ghost'} size="icon" title="Paragraph">
        <Pilcrow className="h-4 w-4" />
      </Button>
      <Button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'} size="icon" title="Heading 1">
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'} size="icon" title="Heading 2">
        <Heading2 className="h-4 w-4" />
      </Button>
      {/* Lists */}
      <Button onClick={() => editor.chain().focus().toggleBulletList().run()} disabled={!editor.can().toggleBulletList()} variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'} size="icon" title="Bullet List">
        <List className="h-4 w-4" />
      </Button>
      <Button onClick={() => editor.chain().focus().toggleOrderedList().run()} disabled={!editor.can().toggleOrderedList()} variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'} size="icon" title="Ordered List">
        <ListOrdered className="h-4 w-4" />
      </Button>
      {/* Other */}
      <Button onClick={() => editor.chain().focus().toggleCodeBlock().run()} disabled={!editor.can().toggleCodeBlock()} variant={editor.isActive('codeBlock') ? 'secondary' : 'ghost'} size="icon" title="Code Block">
        <Code className="h-4 w-4" />
      </Button>
      <Button onClick={() => editor.chain().focus().setHorizontalRule().run()} disabled={!editor.can().setHorizontalRule()} variant="ghost" size="icon" title="Horizontal Rule">
        <Minus className="h-4 w-4" />
      </Button>
    </div>
  )
}

type FromPlainTextProps = {
  setFilesData: React.Dispatch<React.SetStateAction<FileData[]>>;
  agentId: string; 
}

const FromPlainText = ({ setFilesData, agentId }: FromPlainTextProps) => {
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [styledHtml, setStyledHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false); 

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[15rem] p-3',
      },
    },
 
    immediatelyRender: false, // Prevents Tiptap from trying to render on the server
  });

  // Use useEffect to set mounted to true after the component mounts on the client
  useEffect(() => {
    setMounted(true);
    // Cleanup function for Tiptap editor
    return () => {
      if (editor && !editor.isDestroyed) {
        editor.destroy();
      }
    };
  }, [editor]);


  const roughSizeOfStringData = (title: string, text: string): number => {
    try {
      const data = { title, text };
      return new Blob([JSON.stringify(data)]).size;
    } catch (err) {
      console.error('Failed to calculate size:', err);
      return 0;
    }
  };

  const saveTextToAgentFile = async (agentId: string, title: string, rawText: string): Promise<FileData | null> => {
    const size = roughSizeOfStringData(title, rawText);

    const res = await fetch('/api/agent-files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentId,
        fileName: title,
        fileType: 'Text',
        content: rawText,
        size,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('Failed to save agent file:', error);
      return null;
    }

    return await res.json();
  };

  const handleAddText = async () => {
    if (!editor || loading) return;

    const html = editor.getHTML();
    const text = editor.getText();
    setStyledHtml(html);
    setRawText(text);

    if (!title || !text.trim()) {
      alert('Please enter both a title and some text.');
      return;
    }

    try {
      setLoading(true);
      const saved = await saveTextToAgentFile(agentId, title, text);
      if (saved) {
        alert('Text successfully saved to database.');
        setFilesData(prev => [...prev, saved]);
        setTitle('');
        editor.commands.clearContent();
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto bg-transparent">
      <CardHeader>
        <CardTitle className="text-2xl">Text</CardTitle>
        <CardDescription>
          Add and process plain text-based sources to train your AI Agent with precise information.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Title input */}
        <div className="space-y-2">
          <Label htmlFor="text-title" className="text-md font-medium">Title</Label>
          <Input
            id="text-title"
            placeholder="e.g. Refund Request"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Editor */}
        <div className="space-y-2">
          <Label htmlFor="text-body" className="text-md font-medium">Text</Label>
          <div className="border rounded-md bg-background">
            {/* Conditionally render Tiptap components ONLY when mounted on the client */}
            {mounted ? (
              <>
                <TiptapToolbar editor={editor} />
                <EditorContent editor={editor} />
              </>
            ) : (
          
              <div className="min-h-[15rem] flex items-center justify-center text-muted-foreground">
                Loading editor...
              </div>
            )}
          </div>
          <Button className="w-full" onClick={handleAddText} disabled={loading}>
            {loading ? 'Saving...' : 'Add Text'}
          </Button>
        </div>

        {/* Output Preview (Optional) */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Raw Text:</strong> {rawText}</p>
          <p><strong>Styled HTML:</strong></p>
          <div className="p-2 border rounded text-muted-foreground text-sm" dangerouslySetInnerHTML={{ __html: styledHtml }} />
        </div>
      </CardContent>
    </Card>
  )
}

export default FromPlainText;