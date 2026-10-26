const technicalPatterns = [
  /mongo|mongoose|mongodb/i,
  /database|econn|etimedout|enotfound|socket hang up/i,
  /jwt|json web token|token expired|invalid token/i,
  /passport|oauth2strategy|google strategy/i,
  /cloudinary|mailjet|smtp|nodemailer/i,
  /stack|syntaxerror|referenceerror|typeerror/i,
];

const friendlyByStatus = {
  400: "Please check your information and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to perform this action.",
  404: "We could not find what you requested.",
  409: "This information already exists. Please use a different value.",
  413: "That file or request is too large.",
  429: "Too many attempts. Please wait a moment and try again.",
  500: "Something went wrong on our side. Please try again shortly.",
  502: "The service is temporarily unavailable. Please try again shortly.",
  503: "The service is temporarily unavailable. Please try again shortly.",
};

export const getFriendlyErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  const status = error?.status || error?.response?.status;
  const candidate =
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.data?.error ||
    error?.message;

  if (!candidate || technicalPatterns.some((pattern) => pattern.test(candidate))) {
    return friendlyByStatus[status] || fallback;
  }

  return candidate;
};

export default getFriendlyErrorMessage;
