# Fix: Error "no such column: is_active" en Vercel

## 🔍 Problema Identificado

El error ocurría porque el schema de la base de datos SQLite tenía **dos definiciones conflictivas** de la tabla `budgets`:

1. **Primera definición** (líneas 70-84 del schema original): Sin la columna `is_active`
2. **Segunda definición** (líneas 176-190 del schema original): Con la columna `is_active`

Cuando SQLite ejecuta `CREATE TABLE IF NOT EXISTS budgets`, solo crea la **primera definición** que encuentra, ignorando la segunda. Esto causaba que:

- ✅ **En desarrollo local**: La base de datos se creaba correctamente con la primera definición (sin `is_active`)
- ❌ **En producción (Vercel)**: El código intentaba acceder a `is_active`, pero la columna no existía

## 🛠️ Solución Implementada

### 1. **Sistema de Migraciones** (`src/db/migrations.ts`)

Creamos un sistema robusto de migraciones que:

- Mantiene un registro de la versión del schema en la tabla `schema_version`
- Ejecuta migraciones incrementales automáticamente
- Incluye una migración específica (v2) que:
  - Detecta si la tabla `budgets` tiene la columna `is_active`
  - Si no la tiene, **recrea la tabla** con la estructura correcta
  - Preserva todos los datos existentes durante la migración

### 2. **Schema Limpio** (`src/db/schema.ts`)

Limpiamos el schema eliminando:

- ❌ Definiciones duplicadas de la tabla `budgets`
- ❌ Statements `ALTER TABLE` que deberían estar en migraciones
- ✅ Ahora hay una **única definición** de `budgets` con todas las columnas necesarias

### 3. **Integración Automática** (`src/db/sqlite-client.ts`)

Actualizamos el cliente SQLite para:

- Ejecutar migraciones automáticamente al cargar una base de datos existente
- Ejecutar migraciones después de crear una nueva base de datos
- Guardar los cambios de las migraciones en IndexedDB

## 📋 Cambios Realizados

### Archivos Modificados:

1. **`src/db/migrations.ts`** - ✨ NUEVO
   - Sistema completo de migraciones
   - Migración v2 para arreglar la tabla `budgets`

2. **`src/db/schema.ts`** - 🔄 ACTUALIZADO
   - Eliminadas definiciones duplicadas
   - Schema limpio y consistente
   - Versión actualizada a 2.0.0

3. **`src/db/sqlite-client.ts`** - 🔄 ACTUALIZADO
   - Integración automática de migraciones
   - Guardado automático después de migrar

## 🚀 Cómo Funciona

### Para Usuarios Nuevos:
1. Se crea la base de datos con el schema v2.0.0
2. Se ejecutan las migraciones (que no hacen nada porque ya está actualizado)
3. ✅ Todo funciona correctamente

### Para Usuarios Existentes (en Vercel):
1. Se carga la base de datos existente (con schema v1.0.0 sin `is_active`)
2. Se detecta que falta la migración v2
3. Se ejecuta la migración que recrea la tabla `budgets` con `is_active`
4. Se guardan los cambios
5. ✅ La aplicación funciona correctamente

## 🧪 Próximos Pasos

1. **Hacer commit y push** de estos cambios
2. **Desplegar en Vercel**
3. **Probar el registro/login** en producción
4. La migración se ejecutará automáticamente para todos los usuarios

## 📝 Notas Técnicas

- Las migraciones son **idempotentes**: Se pueden ejecutar múltiples veces sin problemas
- El sistema detecta automáticamente qué migraciones faltan y las ejecuta en orden
- Los datos de los usuarios se preservan durante las migraciones
- El sistema usa `try-catch` para manejar columnas que ya existen

## ⚠️ Importante

Si tienes datos de prueba en Vercel que quieres preservar, las migraciones los mantendrán intactos. Si prefieres empezar desde cero, puedes limpiar el almacenamiento del navegador en la consola de desarrollo.
