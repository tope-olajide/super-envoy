/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface FromQAProps {
  agentId: string;
  setFilesData: React.Dispatch<
    React.SetStateAction<
      { fileName: string; fileType: string; content: string; size: number; id?: string }[]
    >
  >;
}

const FromQA = ({ agentId, setFilesData }: FromQAProps) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitQA = async () => {
    setError(null);

    if (!question.trim() || !answer.trim()) {
      setError('Please fill in both question and answer before submitting.');
      return;
    }

    const content = `Question: ${question.trim()}\nAnswer: ${answer.trim()}`;
    const size = content.length;

    setLoading(true);
    try {
      const res = await fetch('/api/agent-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          fileName: question.trim(),
          fileType: 'Q&A',
          content,
          size,
        }),
      });

      if (!res.ok) {
        const errorRes = await res.json();
        throw new Error(errorRes.message || 'Submission failed.');
      }

      const savedFile = await res.json();

      setFilesData((prev) => [
        ...prev,
        {
          fileName: question.trim(),
          fileType: 'Q&A',
          content,
          size,
          id: savedFile.id, 
        },
      ]);

      setQuestion('');
      setAnswer('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex-1 p-6 sm:p-10 shadow-xl rounded-2xl border bg-background max-w-2xl">
      <CardHeader className="pb-6 text-center">
        <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-50">
          Add Q&A 💬
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Manually add one question and answer at a time to train your chatbot.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="question" className="text-base font-medium">
              Question
            </Label>
            <Input
              id="question"
              type="text"
              placeholder="e.g., What is your return policy?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="h-10 text-base mt-1"
            />
          </div>

          <div>
            <Label htmlFor="answer" className="text-base font-medium">
              Answer
            </Label>
            <Textarea
              id="answer"
              placeholder="e.g., You can return items within 30 days..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="min-h-[100px] text-base mt-1"
            />
          </div>

          {error && (
            <div className="text-center text-red-500 text-sm p-2 border border-red-300 bg-red-50 rounded">
              {error}
            </div>
          )}

          <Button
            className="w-full py-2 text-lg font-semibold"
            onClick={handleSubmitQA}
            disabled={loading || !question.trim() || !answer.trim()}
          >
            {loading ? 'Submitting...' : 'Submit Q&A ✨'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FromQA;
