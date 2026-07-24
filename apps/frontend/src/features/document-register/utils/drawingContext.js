import { DRAWING_CONTEXT } from "../constants/document.constants";

export const getDrawingContextFromPathname = (pathname = "") => {
  const normalizedPathname = pathname.toLowerCase();

  if (normalizedPathname.includes("/document-register/pid")) {
    return DRAWING_CONTEXT.PID;
  }

  if (normalizedPathname.includes("/document-register/pfd")) {
    return DRAWING_CONTEXT.PFD;
  }

  return null;
};

export const isValidDrawingContext = (drawingContext) => {
  return Object.values(DRAWING_CONTEXT).includes(drawingContext);
};
