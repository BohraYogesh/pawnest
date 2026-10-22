import type { Request, Response } from "express";
import * as searchService from "./search.service";

export const globalSearch = async (req: Request, res: Response) => {
  const query =
    typeof req.query.q === "string" ? req.query.q.trim() : "";

  if (query.length < 2) {
    res.status(200).json({
      success: true,
      message: "Enter at least 2 characters to search",
      data: { results: [] },
    });
    return;
  }

  const results = await searchService.globalSearch(query);

  res.status(200).json({
    success: true,
    message: "Global search completed successfully",
    data: { results },
  });
};