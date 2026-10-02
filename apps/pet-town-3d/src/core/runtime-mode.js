/** The public website is a separate build, never a query-string desktop override. */
export const isPublicTown = import.meta.env.MODE === "public";
