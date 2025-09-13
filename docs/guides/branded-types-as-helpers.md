# Always Export `as` Helpers with Branded Types

I was working with branded types in TypeScript and realized something: manual type assertions are a code smell.

Here's what I mean. Say you have a branded type for template strings:

```typescript
type TemplateString = string & Brand<'TemplateString'>;
```

The typical approach is to scatter type assertions throughout your code:

```typescript
// This gets messy fast
const template = userInput as TemplateString;
const another = processString(data as TemplateString);
```

But there's a better pattern. Always co-locate an `as` helper function with your branded type:

```typescript
export type TemplateString = string & Brand<'TemplateString'>;

export function asTemplateString(str: string): TemplateString {
    return str as TemplateString;
}
```

Now instead of manual assertions, you use the helper:

```typescript
const template = asTemplateString(userInput);
const another = processString(asTemplateString(data));
```

## The Pattern

Whenever you create a branded type `T`, always export an `asT` function alongside it. 

```typescript
// Always do this
export type UserId = string & Brand<'UserId'>;
export function asUserId(id: string): UserId {
    return id as UserId;
}

export type SafeHtml = string & Brand<'SafeHtml'>;
export function asSafeHtml(html: string): SafeHtml {
    return html as SafeHtml;
}
```

## Why This Works

The helper function is just doing the same type assertion. But it's cleaner:
- One place to change if the type changes
- Easier to search for all places creating that type
- More explicit about what's happening
- Can add validation later if needed

The `as` prefix makes it immediately clear this is a type assertion helper. It reads naturally: `asTemplateString(str)` - "treat this string as a template string".

Keep the helper right next to the type definition. They're a unit. Export them together, document them together.

That's the pattern. Simple but effective.