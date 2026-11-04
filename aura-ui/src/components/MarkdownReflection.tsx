import ReactMarkdown from "react-markdown";
import Box from "@mui/joy/Box";

interface MarkdownReflectionProps {
  value: string;
}

/** Renders a persisted reflection as safe Markdown while keeping the logbook's visual type scale. */
export default function MarkdownReflection({ value }: MarkdownReflectionProps) {
  return (
    <Box sx={{ "& p": { m: 0 }, "& :first-child": { mt: 0 }, "& :last-child": { mb: 0 }, "& h1, & h2, & h3": { fontFamily: "display", lineHeight: 1.2, mt: 1, mb: 0.75 }, "& ul, & ol": { pl: 2.5, my: 0.75 }, "& a": { color: "primary.700" } }}>
      <ReactMarkdown>{value}</ReactMarkdown>
    </Box>
  );
}
