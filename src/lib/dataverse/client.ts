import "server-only";

/**
 * Legacy stub kept for backwards compatibility while the project migrates
 * from Dataverse to .NET API + Azure SQL.
 */
export const getDataverseClient = (): never => {
  throw new Error(
    "Dataverse ya no está soportado en esta arquitectura. Configura BACKEND_API_BASE_URL y usa el backend API.",
  );
};
