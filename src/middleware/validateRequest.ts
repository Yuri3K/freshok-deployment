import ajv from "../utils/ajv";
import { NextFunction, Request, Response } from "express";
import path from 'path'
import fs from 'fs'

// Можно валидировать разные части запроса:
// req.body    - тело запроса (POST / PUT / PATCH)
// req.query   - строка запроса, например: GET /api/products?category=books&page=2
// req.params  - параметры пути, например: GET /api/users/:id или DELETE /api/orders/:id
// req.headers - заголовки запроса, например, для проверки версии API, токенов и т.д.
type RequestPart = 'body' | 'query' | 'params' | 'headers'

// Partial делает все элементы в Record необязательными.
// Record<RequestPart, string> означает: объект с ключами body, query, params, headers и строковыми значениями.
// Partial<Record<...>> делает все эти ключи опциональными. Это означает, что в SchemaMap не нужно передавать все поля из RequestPart
type SchemaMap = Partial<Record<RequestPart, string>>

// В тип Validator будет записан тот тип, который возвращает ajv.compile. 
// TypeScript не знает заранее тип этой функции, поэтому мы сохраняем её тип вот так
type Validator = ReturnType<typeof ajv.compile>;

/**
 * Middleware для валидации данных запроса через JSON Schema.
 * Поддерживает валидацию сразу нескольких частей запроса: body, query, params, headers.
 * Использует библиотеку AJV для проверки данных на соответствие схеме.
 *
 * @param schemaConfig - путь к схеме (строка) или объект, указывающий схемы для разных частей запроса
 * @param defaultTarget - часть запроса по умолчанию (используется, если передана только одна схема)
 *
 * Примеры:
 * validateRequest<RegisterUserRequest>('auth/register.schema.json') — валидирует req.body
 * validateRequest({ query: 'users/query.schema.json', params: 'users/id.schema.json' })
 * 
 * <TBody = any> - TypeScript, когда будет валидировать body для RegisterUserRequest будет знать, 
 * что req.body внутри контроллера — это объект вида { email, password, displayName }
 * 
 * Request<unknown, unknown, TBody> - Тип Request из Express выглядит так: Request<Params, ResBody, ReqBody, ReqQuery>
 * По умолчанию, если ничего не указать, все типы = any:
 * Request<Params = core.ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = core.Query>
 * 
 * Но нам валидация нужна только для body. Поэтому: Request<unknown, unknown, TBody>
 * означает:
 * Params — неизвестно (мы не трогаем req.params) req.params (например /users/:id)
 * ResBody — неизвестно (тип ответа - используется редко)
 * ReqBody — TBody, то есть валидированное тело запроса (req.body)
 * ReqQuery — оставляем дефолт (any)
 */
function validateRequest<TBody = any>(schemaConfig: string | SchemaMap, defauldTarget: RequestPart = 'body') {
  // Объект, где ключ — это часть запроса (body, query, params, headers),
  // а значение — функция-валидатор, скомпилированная через ajv.compile(schema)
  const validators: Partial<Record<RequestPart, Validator>> = {}

  // Если schemaConfig — это строка, значит валидация применяется только к одной части запроса (по умолчанию — body).
  // Если объект — то валидируем несколько частей (например, body + query).
  const schemas: SchemaMap = typeof schemaConfig === 'string' ?
    { [defauldTarget]: schemaConfig } :
    schemaConfig


  // Проходим по всем переданным схемам и компилируем их
  for (const [part, schemaPath] of Object.entries(schemas)) {
    const fullPath = path.join(__dirname, '..', 'validators', schemaPath)

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Schema file not found ${fullPath}`)
    }

    // Загружаем и парсим JSON-схему
    const schema = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));

    // Компилируем схему с помощью AJV и сохраняем функцию-валидатор
    validators[part as RequestPart] = ajv.compile(schema)
  }

  // Возвращаем непосредственно middleware для Express. 
  // Про Request<unknown, unknown, TBody> написано в комментариях сверху
  return (req: Request<unknown, unknown, TBody>, res: Response, next: NextFunction) => {
    // Массив, куда будут собираться все найденные ошибки (из разных частей запроса)
    const allErrors: {
      part: RequestPart,
      field: string,
      message: string
    }[] = []

    // Проверяем каждую часть запроса, для которой есть схема
    for (const [part, validate] of Object.entries(validators)) {
      const data = req[part as RequestPart] // например req.body, req.query и т.д.
      const valid = validate(data) // проверяем данные по схеме

      // Если валидация не прошла, добавляем ошибки в общий массив
      if (!valid) {
        const errors = validate.errors?.map((err: any) => {
          return {
            part: part as RequestPart,
            field: err.instancePath || err.params.missingProperty,
            message: err.message
          }
        }) || []

        allErrors.push(...errors)
      }
    }

    // Если были ошибки — отправляем 400 Bad Request и подробное описание
    if (allErrors.length > 0) {
      return res.status(400).json({
        message: 'Validation error',
        error: allErrors
      })
    }

    // Если всё прошло успешно — передаём управление дальше
    next()
  }
}

export default validateRequest