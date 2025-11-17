'use client';

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Sender = "user" | "companion";

type Message = {
  id: string;
  sender: Sender;
  text: string;
  timestamp: number;
};

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const BOT_INTRO = [
  "Hey there! I'm your cozy chat companion.",
  "Tell me what's on your mind or how your day's been going.",
  "I'm here to listen, celebrate the wins, and sit with the lows.",
];

const RESPONSE_BANK: { test: (input: string) => boolean; replies: string[] }[] =
  [
    {
      test: (input) => /(^|\b)(hi|hello|hey)(\b|!|.|,)/i.test(input),
      replies: [
        "Hi! What's the vibe today?",
        "Hello hello! How's it going?",
        "Hey there! Anything fun happening?",
      ],
    },
    {
      test: (input) => /\b(thank(s| you)|appreciate)\b/i.test(input),
      replies: [
        "Anytime! I'm just happy to be here with you.",
        "You're super welcome. Want to keep chatting?",
      ],
    },
    {
      test: (input) => /\b(sad|down|blue|tired|exhausted)\b/i.test(input),
      replies: [
        "I'm sorry it's feeling heavy right now. Want to talk it through?",
        "That sounds rough. I'm here for whatever you need to unpack.",
      ],
    },
    {
      test: (input) => /\b(happy|excited|great|awesome|amazing)\b/i.test(input),
      replies: [
        "Love that energy! What made it so good?",
        "That sounds awesome. Share the highlight with me!",
      ],
    },
    {
      test: (input) => /\b(work|job|project|deadline)\b/i.test(input),
      replies: [
        "Work can be a ride. What's happening on your plate?",
        "Let it all out—what's the latest from the grind?",
      ],
    },
    {
      test: () => true,
      replies: [
        "I'm listening. Tell me more.",
        "Got it. Where should we take this next?",
        "Mhmm, I'm following along. What's the next chapter?",
      ],
    },
  ];

function generateResponse(input: string, history: Message[]): string {
  const lowerInput = input.toLowerCase();
  if (history.length > 6 && !/thank/i.test(lowerInput)) {
    return "We've covered a bunch! Anything else you'd like to explore together?";
  }

  const matched = RESPONSE_BANK.find((entry) => entry.test(lowerInput));
  const replies = matched?.replies ?? RESPONSE_BANK.at(-1)?.replies ?? [];
  if (!replies.length) {
    return "I'm here and listening. Tell me more about that.";
  }

  const usedResponses = history
    .filter((message) => message.sender === "companion")
    .map((message) => message.text);

  const freshReply = replies.find((reply) => !usedResponses.includes(reply));
  return freshReply ?? replies[Math.floor(Math.random() * replies.length)];
}

const companionTypingDelay = (input: string) =>
  Math.min(2400, Math.max(800, input.length * 45));

export default function Home() {
  const [messages, setMessages] = useState<Message[]>(() =>
    BOT_INTRO.map((text, index) => ({
      id: `intro-${index}`,
      sender: "companion" as const,
      text,
      timestamp: Date.now() + index,
    }))
  );
  const [pendingMessage, setPendingMessage] = useState("");
  const [isCompanionTyping, setIsCompanionTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isCompanionTyping]);

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      const trimmed = pendingMessage.trim();
      if (!trimmed || isCompanionTyping) {
        return;
      }

      const userMessage: Message = {
        id: createId(),
        sender: "user",
        text: trimmed,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setPendingMessage("");

      setIsCompanionTyping(true);

      const reply = generateResponse(trimmed, [...messages, userMessage]);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            sender: "companion",
            text: reply,
            timestamp: Date.now(),
          },
        ]);
        setIsCompanionTyping(false);
      }, companionTypingDelay(trimmed));
    },
    [pendingMessage, isCompanionTyping, messages]
  );

  const formattedMessages = useMemo(
    () =>
      messages.map((message) => ({
        ...message,
        time: new Intl.DateTimeFormat("en", {
          hour: "numeric",
          minute: "2-digit",
        }).format(message.timestamp),
      })),
    [messages]
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col bg-amber-50 px-3 py-6 sm:px-6 lg:px-10">
      <header className="mb-6 rounded-2xl border border-amber-200 bg-white/70 p-6 shadow-lg [shadow:0_20px_45px_rgba(217,119,6,0.12)] backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-500">
              Cozy Corner
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-stone-900 sm:text-4xl">
              Let&apos;s Chat For A While
            </h1>
          </div>
          <p className="max-w-md text-sm text-stone-600 sm:text-base">
            Drop a thought, share a story, or simply say hi. This companion is
            tuned for laid-back, judgement-free conversations.
          </p>
        </div>
      </header>
      <main className="flex h-full flex-1 flex-col overflow-hidden rounded-3xl border border-amber-200 bg-white/80 shadow-xl [shadow:0_30px_60px_rgba(217,119,6,0.12)] backdrop-blur">
        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6"
        >
          {formattedMessages.map((message) => (
            <article
              key={message.id}
              className={`flex items-end gap-3 ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.sender === "companion" && (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-amber-300 text-sm font-semibold text-stone-900 shadow">
                  C
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm sm:text-base ${
                  message.sender === "user"
                    ? "bg-stone-900 text-amber-50"
                    : "bg-white text-stone-900 border border-amber-100"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">
                  {message.text}
                </p>
                <span
                  className={`mt-2 block text-xs ${
                    message.sender === "user"
                      ? "text-amber-200"
                      : "text-amber-500"
                  }`}
                >
                  {message.time}
                </span>
              </div>
              {message.sender === "user" && (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-stone-800 to-stone-900 text-sm font-semibold text-amber-50 shadow">
                  You
                </div>
              )}
            </article>
          ))}
          {isCompanionTyping && (
            <div className="flex items-end gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-amber-300 text-sm font-semibold text-stone-900 shadow">
                C
              </div>
              <div className="flex max-w-[70%] items-center gap-2 rounded-2xl border border-amber-100 bg-white px-4 py-3">
                <span className="sr-only">Companion is typing</span>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-amber-300 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-amber-300 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-amber-300 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
        <form
          onSubmit={handleSubmit}
          className="border-t border-amber-100 bg-white/90 p-4 shadow-inner [shadow:0_-15px_40px_rgba(217,119,6,0.08)] sm:p-6"
        >
          <div className="flex items-end gap-3 sm:gap-4">
            <label className="sr-only" htmlFor="message">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              placeholder="Type something honest or goofy…"
              className="min-h-[3rem] flex-1 resize-none rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-sm text-stone-900 shadow-inner [shadow:inset_0_0_15px_rgba(217,119,6,0.08)] outline-none transition focus:border-amber-300 focus:ring focus:ring-amber-200/80 sm:text-base"
              value={pendingMessage}
              onChange={(event) => setPendingMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit(event);
                }
              }}
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-amber-50 shadow-lg shadow-stone-900/20 transition hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-700 sm:text-base"
            >
              Send
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
