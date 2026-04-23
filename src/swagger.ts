// ============================================
// Swagger/OpenAPI Configuration
// ============================================

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AgroControl API',
      version: '1.0.0',
      description: 'API para Sistema de Inventario Agrícola',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Current server',
      },
    ],
    components: {
      schemas: {
        // Product schemas
        CreateProductDto: {
          type: 'object',
          required: ['name', 'typeId', 'stateId', 'baseUnit'],
          properties: {
            name: { type: 'string', example: 'Glifosato' },
            genericName: { type: 'string', example: 'Glifosato' },
            typeId: { type: 'string', example: 'uuid' },
            stateId: { type: 'string', example: 'uuid' },
            baseUnit: { type: 'string', enum: ['KG', 'G', 'L', 'ML', 'CC'], example: 'L' },
            doseType: { type: 'string', enum: ['PER_HECTARE', 'CONCENTRATION'] },
            doseUnit: { type: 'string', enum: ['BASE_UNIT', 'CC', 'ML', 'G', 'KG', 'L'] },
            dosePerHectareMin: { type: 'number', example: 2 },
            dosePerHectareMax: { type: 'number', example: 4 },
            concentrationPerLiter: { type: 'number', example: 50 },
            concentration: { type: 'number', example: 36 },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid' },
            name: { type: 'string', example: 'Glifosato' },
            genericName: { type: 'string', example: 'Glifosato' },
            typeId: { type: 'string' },
            stateId: { type: 'string' },
            baseUnit: { type: 'string' },
            doseType: { type: 'string' },
            doseUnit: { type: 'string' },
            dosePerHectareMin: { type: 'number' },
            dosePerHectareMax: { type: 'number' },
            concentrationPerLiter: { type: 'number' },
            concentration: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            type: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
            state: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
          },
        },
        
        // Lot schemas
        CreateLotDto: {
          type: 'object',
          required: ['productId', 'initialStock'],
          properties: {
            productId: { type: 'string', example: 'uuid' },
            entryDate: { type: 'string', format: 'date', example: '2024-01-15' },
            expiryDate: { type: 'string', format: 'date', example: '2025-01-15' },
            supplier: { type: 'string', example: 'Proveedor S.A.' },
            initialStock: { type: 'number', example: 100 },
            lotCode: { type: 'string', example: 'LOT-2024-001' },
            containerType: { type: 'string', example: 'Tambor' },
            containerCapacity: { type: 'number', example: 20 },
          },
        },
        Lot: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            productId: { type: 'string' },
            entryDate: { type: 'string' },
            expiryDate: { type: 'string' },
            supplier: { type: 'string' },
            initialStock: { type: 'number' },
            lotCode: { type: 'string' },
            containerCapacity: { type: 'number' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
            product: { $ref: '#/components/schemas/Product' },
          },
        },

        // Field schemas
        CreateFieldDto: {
          type: 'object',
          required: ['name', 'area'],
          properties: {
            name: { type: 'string', example: 'Lote Norte' },
            area: { type: 'number', example: 50 },
            location: { type: 'string', example: 'Ciudad Evita' },
            latitude: { type: 'number', example: -34.0 },
            longitude: { type: 'number', example: -58.0 },
            productId: { type: 'string', nullable: true },
          },
        },
        Field: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            area: { type: 'number' },
            location: { type: 'string' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            productId: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },

        // Application schemas
        CreateApplicationDto: {
          type: 'object',
          required: ['fieldId', 'type'],
          properties: {
            fieldId: { type: 'string', example: 'uuid' },
            type: { type: 'string', enum: ['FUMIGACION', 'SIEMBRA'] },
            date: { type: 'string', format: 'date', example: '2024-01-15' },
            waterAmount: { type: 'number', example: 500 },
            notes: { type: 'string', example: 'Aplicación preventivo' },
            products: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: { type: 'string' },
                  dosePerHectare: { type: 'number' },
                  concentration: { type: 'number' },
                  concentrationPerLiter: { type: 'number' },
                  quantityUsed: { type: 'number' },
                },
              },
            },
          },
        },
        Application: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            fieldId: { type: 'string' },
            type: { type: 'string' },
            date: { type: 'string' },
            waterAmount: { type: 'number' },
            notes: { type: 'string' },
            createdAt: { type: 'string' },
          },
        },

        // Movement schemas
        CreateMovementDto: {
          type: 'object',
          required: ['productId', 'type', 'quantity'],
          properties: {
            productId: { type: 'string', example: 'uuid' },
            lotId: { type: 'string', nullable: true },
            type: { type: 'string', enum: ['ENTRADA', 'SALIDA'] },
            quantity: { type: 'number', example: 50 },
            notes: { type: 'string', example: 'Compra de insumos' },
          },
        },
        Movement: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            productId: { type: 'string' },
            lotId: { type: 'string' },
            type: { type: 'string' },
            quantity: { type: 'number' },
            notes: { type: 'string' },
            createdAt: { type: 'string' },
          },
        },

        // Tancada schemas
        CreateTancadaDto: {
          type: 'object',
          required: ['tankCapacity', 'waterAmount', 'products', 'fields'],
          properties: {
            date: { type: 'string', format: 'date' },
            tankCapacity: { type: 'number', example: 1000 },
            waterAmount: { type: 'number', example: 800 },
            notes: { type: 'string' },
            products: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: { type: 'string' },
                  concentration: { type: 'number' },
                  quantity: { type: 'number' },
                },
              },
            },
            fields: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  fieldId: { type: 'string' },
                  hectaresTreated: { type: 'number' },
                  productUsed: { type: 'number' },
                },
              },
            },
          },
        },
        Tancada: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            date: { type: 'string' },
            tankCapacity: { type: 'number' },
            waterAmount: { type: 'number' },
            notes: { type: 'string' },
            createdAt: { type: 'string' },
          },
        },

        // Tank schemas
        CreateTankDto: {
          type: 'object',
          required: ['name', 'capacity'],
          properties: {
            name: { type: 'string', example: 'Tanque Principal' },
            capacity: { type: 'number', example: 1000 },
          },
        },
        Tank: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            capacity: { type: 'number' },
            createdAt: { type: 'string' },
          },
        },

        // Error
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

export const swaggerUiOptions = {
  customCss: `
    .topbar { display: none }
    .swagger-ui .info { margin: 30px 0 }
    .swagger-ui .info .title { font-size: 2.5em }
  `,
  customSiteTitle: 'AgroControl API Docs',
};

export default swaggerJsdoc(options);