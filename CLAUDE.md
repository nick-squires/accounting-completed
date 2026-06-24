# CLAUDE.md

## Domain model

The data model is flat and the word "client" is overloaded (it means **the firm** in
the DB/auth layer and **a customer of the firm** in the API/UI layer). Before writing
or changing anything that touches users, firms, clients, or roles, read
[`packages/contracts/DOMAIN.md`](packages/contracts/DOMAIN.md). It pins the vocabulary
and explains how to decode the role flags.
