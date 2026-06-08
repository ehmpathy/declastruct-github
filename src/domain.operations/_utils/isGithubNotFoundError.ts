/**
 * .what = checks if error is a GitHub API 404 response
 * .why = enables idempotent get/delete operations
 *
 * .note = checks status property from Octokit RequestError, not string match
 *         prevents false positives from other errors with "Not Found" in message
 */
export const isGithubNotFoundError = (input: { error: Error }): boolean => {
  // octokit errors have a status property for HTTP status code
  const status = (input.error as { status?: number }).status;
  return status === 404;
};
