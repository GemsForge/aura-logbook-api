import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import ArrowBack from "@mui/icons-material/ArrowBack";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import CloudOutlined from "@mui/icons-material/CloudOutlined";
import WbSunnyOutlined from "@mui/icons-material/WbSunnyOutlined";
import dayjs from "dayjs";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import { MoodApi } from "@/api/MoodApi";
import type { MoodEntry } from "@/features/mood/models/schema";
import MarkdownReflection from "@/components/MarkdownReflection";
import MoodUpdateModal from "@/components/MoodUpdateModal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { MoodTag } from "@/components/history/MoodTag";
import MoodMediaGallery from "@/components/history/MoodMediaGallery";
import { useGetReferenceDataQuery } from "@/store/referenceDataApi";
import { useAppDispatch } from "@/store/hooks";
import { auraApi } from "@/store/auraApi";

/** Orders entries oldest to newest by day, then by logged time, for Earlier/Later stepping. */
const byTime = (a: MoodEntry, b: MoodEntry) => a.date.localeCompare(b.date) || (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
type MoodEntryWithWeather = MoodEntry & { weatherSnapshot?: string | null };

/**
 * Reading view for one reflection at `/history/:id`: a narrow serif column with the full writing, its moods,
 * and its captured moments at full size (song card, weather card, photo grid). "Earlier" and "Later" step
 * through every entry in time order across days; Edit and Delete sit at the end, after reading. The date is
 * the page's h1 and receives focus on load so screen readers start at the top of each entry.
 */
export default function ReflectionRead() {
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<MoodEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { data: referenceData } = useGetReferenceDataQuery();

  const load = useCallback(async () => {
    setFailed(false);
    try { setEntries([...(await MoodApi.getAllMoods())].sort(byTime)); } catch { setFailed(true); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const index = entries?.findIndex((entry) => entry.id === Number(id)) ?? -1;
  const entry = index >= 0 ? entries![index] : null;
  useEffect(() => { headingRef.current?.focus(); }, [entry?.id]);

  if (failed) return <Box role="alert" sx={{ maxWidth: 640, mx: "auto", py: 6 }}><Typography color="danger">We couldn’t load this reflection.</Typography><Button onClick={() => void load()}>Try again</Button></Box>;
  if (!entries) return <Typography role="status" sx={{ py: 6, textAlign: "center" }}>Opening your reflection…</Typography>;
  if (!entry) return <Box sx={{ maxWidth: 640, mx: "auto", py: 6 }}><Typography level="h2">This reflection isn’t here anymore.</Typography><Button onClick={() => navigate("/history")} sx={{ mt: 2 }}>Back to Reflections</Button></Box>;

  const earlier = entries[index - 1];
  const later = entries[index + 1];
  const sameDay = entries.filter((other) => other.date === entry.date);
  const moodDefinition = (mood: string) => referenceData?.moods.find((definition) => definition.key === mood);
  const auraColor = (mood: string) => {
    const aura = referenceData?.auras.find((definition) => definition.key === moodDefinition(mood)?.auraColorKeys[0]);
    return aura?.shades?.[500] ?? aura?.baseHex ?? "var(--aura-accent)";
  };
  const time = entry.createdAt ? dayjs(entry.createdAt).format("h:mm A") : null;
  const weather = parseSnapshot<{ description?: string; iconCode?: string; temperature?: number; unit?: string }>((entry as MoodEntryWithWeather).weatherSnapshot);
  const clear = !!weather && (/clear/i.test(weather.description ?? "") || (weather.iconCode ?? "").startsWith("01"));
  const backTo = `/history?date=${entry.date}`;

  return (
    <Box className="signed-in-content" sx={{ maxWidth: 1000, mx: "auto" }}>
      <Box component="nav" aria-label="Reflection navigation" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Button onClick={() => navigate(backTo)} variant="outlined" size="small" startIcon={<ArrowBack />}>Reflections</Button>
        <Box sx={{ display: "flex", gap: .75 }}>
          <Button onClick={() => earlier && navigate(`/history/${earlier.id}`)} variant="outlined" size="small" startIcon={<ChevronLeft />} disabled={!earlier} aria-label={earlier ? `Earlier reflection, ${dayjs(earlier.date).format("MMMM D")}` : "No earlier reflection"}>Earlier</Button>
          <Button onClick={() => later && navigate(`/history/${later.id}`)} variant="outlined" size="small" endIcon={<ChevronRight />} disabled={!later} aria-label={later ? `Later reflection, ${dayjs(later.date).format("MMMM D")}` : "No later reflection"}>Later</Button>
        </Box>
      </Box>

      <Box component="article" aria-labelledby="reflection-title" sx={{ maxWidth: 620, mx: "auto", mt: { xs: 3, sm: 4 }, pb: 4 }}>
        <Box aria-hidden="true" sx={{ width: 56, height: 4, borderRadius: 99, bgcolor: auraColor(entry.moods[0] ?? "") }} />
        <Typography id="reflection-title" ref={headingRef} tabIndex={-1} component="h1" sx={{ fontFamily: "var(--joy-fontFamily-display)", fontSize: { xs: "1.9rem", sm: "2.3rem" }, lineHeight: 1.15, mt: 1.5, outline: "none" }}>
          {dayjs(entry.date).format("dddd, MMMM D")}
        </Typography>
        <Typography level="body-sm" color="neutral" sx={{ mt: .5 }}>
          {[time, sameDay.length > 1 ? `${sameDay.findIndex((other) => other.id === entry.id) + 1} of ${sameDay.length} check-ins that day` : null, dayjs(entry.date).format("YYYY")].filter(Boolean).join(" · ")}
        </Typography>
        <Box component="ul" aria-label="Moods" sx={{ listStyle: "none", p: 0, m: 0, mt: 1.5, display: "flex", gap: .75, flexWrap: "wrap" }}>
          {[...entry.moods].sort((left, right) => left.localeCompare(right)).map((mood) => (
            <Box component="li" key={mood}><MoodTag mood={mood} /></Box>
          ))}
        </Box>

        {entry.comment
          ? <Box sx={{ mt: 3, fontFamily: "var(--joy-fontFamily-display)", fontSize: { xs: "1.08rem", sm: "1.15rem" }, lineHeight: 1.8, overflowWrap: "anywhere", "& p": { m: 0, mb: 1.75 } }}><MarkdownReflection value={entry.comment} /></Box>
          : <Typography level="body-md" color="neutral" sx={{ mt: 3 }}>No words this time, just the moods.</Typography>}

        {weather?.description && <Box sx={{ mt: 3 }}><MomentCard icon={clear ? <WbSunnyOutlined /> : <CloudOutlined />} tint={clear ? "#f2c94c" : "#9fb7e6"} title={weather.temperature !== undefined ? `${Math.round(weather.temperature)}°${weather.unit ?? "F"}` : "Weather"} caption={weather.description} /></Box>}

        <MoodMediaGallery moodEntryId={entry.id} />

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap", mt: 4, pt: 2, borderTop: "1px solid var(--al-theme-border)" }}>
          <Typography level="body-xs" color="neutral">{entry.createdAt ? `Saved ${dayjs(entry.createdAt).format("MMM D, h:mm A")}` : ""}</Typography>
          <Box sx={{ display: "flex", gap: .75 }}>
            <Button variant="outlined" size="small" startIcon={<EditOutlined />} onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="outlined" size="small" startIcon={<DeleteOutline />} onClick={() => setDeleting(true)}>Delete</Button>
          </Box>
        </Box>
      </Box>

      {editing && <MoodUpdateModal entry={entry} onClose={() => setEditing(false)} onSuccess={() => void load()} />}
      {deleting && (
        <DeleteConfirmDialog entry={entry} onClose={() => setDeleting(false)} onConfirm={async () => {
          await MoodApi.deleteMood(entry.id);
          // Keep the global color in sync when an entry is removed from its reading view.
          dispatch(auraApi.util.invalidateTags(["Aura", "AuraSeasons"]));
          setDeleting(false);
          // After deleting, keep reading: go to the neighbouring entry, or back to the list when none remain.
          navigate(later ? `/history/${later.id}` : earlier ? `/history/${earlier.id}` : "/history", { replace: true });
          void load();
        }} />
      )}
    </Box>
  );
}

/** A captured moment at full size; a link when it has somewhere to go (the song), plain otherwise (the weather). */
function MomentCard({ icon, tint, title, caption, href }: { icon: React.ReactNode; tint: string; title: string; caption: string; href?: string }) {
  return (
    <Box component={href ? "a" : "div"} href={href} target={href ? "_blank" : undefined} rel={href ? "noreferrer" : undefined}
      sx={{ display: "flex", alignItems: "center", gap: 1.25, p: 1.5, borderRadius: "lg", border: "1px solid var(--al-theme-border)", bgcolor: "var(--al-theme-surface-raised)", color: "inherit", textDecoration: "none", "&:focus-visible": { outline: "2px solid var(--al-theme-focus)", outlineOffset: 2 } }}>
      <Box aria-hidden="true" sx={{ width: 40, height: 40, borderRadius: "md", display: "grid", placeItems: "center", color: tint, bgcolor: `color-mix(in oklab, ${tint} 18%, transparent)` }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography level="title-sm" noWrap>{title}</Typography>
        <Typography level="body-xs" color="neutral" noWrap>{caption}</Typography>
      </Box>
    </Box>
  );
}

/** Parses an optional stored snapshot and treats malformed historical data as absent. */
function parseSnapshot<T>(value?: string | null): T | null {
  if (!value) return null;
  try { return JSON.parse(value) as T; } catch { return null; }
}
