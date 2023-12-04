import { Inter } from "next/font/google";
import cronstrue from "cronstrue";
import { useEffect, useMemo, useState } from "react";
import parser from "cron-parser";
import clsx from "clsx";
import Head from "next/head";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [cron, setCron] = useState("0 0 * * *");

  const [explanation, valid] = useMemo(() => {
    try {
      return [cronstrue.toString(cron), true];
    } catch (e) {
      console.log(e);
      return ["", false];
    }
  }, [cron]);

  const [next, setNext] = useState("");

  useEffect(() => {
    // This has to be done in an effect to prevent it to run on the server
    try {
      const interval = parser.parseExpression(cron);
      const next = interval.next().toDate();
      setNext(next.toLocaleString());
    } catch (e) {
      setNext("");
    }
  }, [cron]);

  function generate(prompt: string) {
    setLoading(true);
    fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setCron(res.result);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }

  return (
    <main className={`${inter.className} max-w-4xl mx-auto my-48`}>
      <Head>
        <title>Cronify - Generate and explain cron schedule expressions</title>
        <meta
          name="description"
          content="Generate and explain cron schedule expressions"
        />
      </Head>
      <div>
        <div className="mb-20">
          <div
            className="text-gray-300 text-6xl text-center mb-5 font-bold focus:outline-none italic"
            contentEditable={true}
            suppressContentEditableWarning={true}
            onBlur={(e) => generate(e.currentTarget.textContent || "")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
          >
            {explanation || "Invalid cron expression"}
          </div>
        </div>
        <input
          type="text"
          className={clsx(
            "w-full bg-gray-800 px-3 py-2 rounded-md text-4xl text-center text-white focus:outline-none tracking-[0.5em] mb-5",
            !valid && "ring-2 ring-red-500",
            loading && "animate-pulse"
          )}
          value={cron}
          onChange={(e) => setCron(e.target.value)}
        />
        <div className="text-lg text-gray-400 text-center mb-10">
          <span className="font-thin">Next at</span>{" "}
          <span className="font-light">{next || "-"}</span>
        </div>
      </div>
    </main>
  );
}
