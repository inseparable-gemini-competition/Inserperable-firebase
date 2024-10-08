// schemaGenerator.js

import { FunctionDeclarationSchemaType } from '@google/generative-ai';

export const generateSchema = (description, properties, requiredKeys = []) => {
  const typeMap = {
    string: FunctionDeclarationSchemaType.STRING,
    number: FunctionDeclarationSchemaType.NUMBER,
    boolean: FunctionDeclarationSchemaType.BOOLEAN,
    array: FunctionDeclarationSchemaType.ARRAY,
    object: FunctionDeclarationSchemaType.OBJECT,
  };

  const schemaProperties = {};
  const required = requiredKeys.length > 0 ? requiredKeys : [];

  for (const key in properties) {
    const prop = properties[key];
    if (typeof prop === 'string') {
      schemaProperties[key] = {
        type: typeMap[prop],
        nullable: false,
      };
    } else {
      if (prop[0] === 'array') {
        const itemType = prop[3] ? typeMap[prop[3]] : FunctionDeclarationSchemaType.STRING;
        schemaProperties[key] = {
          type: typeMap[prop[0]],
          description: prop[1],
          nullable: prop[2] ?? false,
          items: {
            type: itemType,
          },
        };
      } else if (prop[0] === 'object') {
        const objectProperties = {};
        const nestedProperties = prop[3];
        const nestedRequiredKeys = prop[4] || [];
        if (nestedProperties && typeof nestedProperties === 'object') {
          for (const nestedKey in nestedProperties) {
            const nestedProp = nestedProperties[nestedKey];
            if (typeof nestedProp === 'string') {
              objectProperties[nestedKey] = {
                type: typeMap[nestedProp],
                nullable: false,
              };
            } else {
              objectProperties[nestedKey] = {
                type: typeMap[nestedProp[0]],
                description: nestedProp[1],
                nullable: nestedProp[2] ?? false,
              };
            }
          }
        }
        schemaProperties[key] = {
          type: typeMap[prop[0]],
          description: prop[1],
          nullable: prop[2] ?? false,
          properties: objectProperties,
          required: nestedRequiredKeys,
        };
      } else {
        schemaProperties[key] = {
          type: typeMap[prop[0]],
          description: prop[1],
          nullable: prop[2] ?? false,
        };
      }
    }
    if (requiredKeys.length === 0) {
      required.push(key);
    }
  }

  return {
    description: description,
    type: FunctionDeclarationSchemaType.OBJECT,
    properties: schemaProperties,
    required: required,
  };
};