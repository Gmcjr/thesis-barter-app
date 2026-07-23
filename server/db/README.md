PRISMA UPDATES

- Migrate: Updates schemas (actual DB things)
- Generate: Generates TypeScript client to reflect schemas

ONLY edit ./server/db/prisma/schema.prisma
This file is where we can edit schemas. If you run the "npm run migrate" script
found in our package.json it will automatically migrate and generate. 

note:
If another collaborator pushes schema work to upstream, and you pull down, 
your schemas in your directory will be up to date as well as your TypeScript client. You still need to migrate for the changes to take effect on your local dev database.