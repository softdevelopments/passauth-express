export type OpenApiOptions = {
    url: string;
    email?: boolean;
};
type OpenApiSchema = Record<string, unknown>;
export declare const getOpenApiDocumentation: ({ url, email, }: OpenApiOptions) => OpenApiSchema;
export {};
