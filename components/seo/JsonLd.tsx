import React from "react";

type JsonLdProps = {
  data: unknown;
};

function safeJsonStringify(value: unknown) {
  // Prevent accidental XSS if future content becomes user-generated.
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonStringify(data) }}
    />
  );
}
