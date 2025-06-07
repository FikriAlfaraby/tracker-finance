import type { CollectionConfig } from 'payload'

export const PocketTransactions: CollectionConfig = {
  slug: 'pocket-transactions',
  admin: {
    useAsTitle: 'description',
    defaultColumns: ['user', 'fromPocket', 'toPocket', 'amount', 'transactionType', 'date'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return {
        user: {
          equals: user?.id,
        },
      }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return {
        user: {
          equals: user?.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return {
        user: {
          equals: user?.id,
        },
      }
    },
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        condition: () => false,
      },
    },
    {
      name: 'transactionType',
      type: 'select',
      options: [
        {
          label: 'Transfer Antar Kantong',
          value: 'transfer',
        },
      ],
      required: true,
    },
    {
      name: 'fromPocket',
      type: 'relationship',
      relationTo: 'pockets',
      admin: {
        description: 'Kantong sumber (untuk transfer dan withdraw)',
        condition: (data) =>
          data?.transactionType === 'transfer' || data?.transactionType === 'withdraw',
      },
    },
    {
      name: 'toPocket',
      type: 'relationship',
      relationTo: 'pockets',
      admin: {
        description: 'Kantong tujuan (untuk transfer dan top up)',
        condition: (data) =>
          data?.transactionType === 'transfer' || data?.transactionType === 'topup',
      },
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'description',
      type: 'text',
      admin: {
        description: 'Deskripsi transaksi',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      defaultValue: () => new Date(),
    },
    {
      name: 'relatedTransaction',
      type: 'relationship',
      relationTo: 'transactions',
      admin: {
        description: 'Transaksi utama yang terkait (jika ada)',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Catatan tambahan',
      },
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        // Ensure user is set
        if (req.user) {
          return {
            ...data,
            user: req.user.id,
          }
        }
        return data
      },
    ],
    beforeChange: [
      async ({ data, req }) => {
        // Extract IDs from pocket objects if they are populated
        const fromPocketId =
          typeof data.fromPocket === 'object' && data.fromPocket?.id
            ? data.fromPocket.id
            : data.fromPocket

        const toPocketId =
          typeof data.toPocket === 'object' && data.toPocket?.id ? data.toPocket.id : data.toPocket

        // Validate transaction type requirements
        if (data.transactionType === 'transfer') {
          if (!fromPocketId || !toPocketId) {
            throw new Error('Transfer memerlukan kantong sumber dan tujuan')
          }
          if (fromPocketId === toPocketId) {
            throw new Error('Kantong sumber dan tujuan tidak boleh sama')
          }
        } else if (data.transactionType === 'topup') {
          if (!toPocketId) {
            throw new Error('Top up memerlukan kantong tujuan')
          }
        } else if (data.transactionType === 'withdraw') {
          if (!fromPocketId) {
            throw new Error('Withdraw memerlukan kantong sumber')
          }
        }

        // Validate pocket balance for transfer and withdraw
        if (
          (data.transactionType === 'transfer' || data.transactionType === 'withdraw') &&
          fromPocketId
        ) {
          try {
            const fromPocket = await req.payload.findByID({
              collection: 'pockets',
              id: fromPocketId,
            })

            if (
              fromPocket &&
              (fromPocket.balance === null ||
                fromPocket.balance === undefined ||
                fromPocket.balance < data.amount)
            ) {
              throw new Error(
                `Saldo kantong ${fromPocket.name} tidak mencukupi atau tidak valid. Saldo: Rp ${fromPocket.balance?.toLocaleString('id-ID') ?? '0'}, Dibutuhkan: Rp ${data.amount.toLocaleString('id-ID')}`,
              )
            }
          } catch (error) {
            throw error
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === 'create' || operation === 'update') {
          try {
            console.log('Processing pocket transaction:', doc)

            // Extract IDs from pocket objects if they are populated
            const fromPocketId =
              typeof doc.fromPocket === 'object' && doc.fromPocket?.id
                ? doc.fromPocket.id
                : doc.fromPocket

            const toPocketId =
              typeof doc.toPocket === 'object' && doc.toPocket?.id ? doc.toPocket.id : doc.toPocket

            // Update pocket balances based on transaction type
            if (doc.transactionType === 'transfer' && fromPocketId && toPocketId) {
              // Transfer: subtract from source, add to destination
              const fromPocket = await req.payload.findByID({
                collection: 'pockets',
                id: fromPocketId,
              })

              const toPocket = await req.payload.findByID({
                collection: 'pockets',
                id: toPocketId,
              })

              console.log('Transfer details:', {
                fromPocket: fromPocket?.name,
                fromBalance: fromPocket?.balance,
                toPocket: toPocket?.name,
                toBalance: toPocket?.balance,
                amount: doc.amount,
              })

              if (fromPocket && toPocket) {
                // Update source pocket
                const newFromBalance = Math.max(0, (fromPocket.balance ?? 0) - doc.amount)
                await req.payload.update({
                  collection: 'pockets',
                  id: fromPocketId,
                  data: {
                    balance: newFromBalance,
                  },
                })
                console.log(`Updated source pocket ${fromPocket.name} balance to ${newFromBalance}`)

                // Update destination pocket
                const newToBalance = (toPocket.balance ?? 0) + doc.amount
                await req.payload.update({
                  collection: 'pockets',
                  id: toPocketId,
                  data: {
                    balance: newToBalance,
                  },
                })
                console.log(
                  `Updated destination pocket ${toPocket.name} balance to ${newToBalance}`,
                )
              }
            } else if (doc.transactionType === 'topup' && toPocketId) {
              // Top up: add to destination pocket
              const toPocket = await req.payload.findByID({
                collection: 'pockets',
                id: toPocketId,
              })

              console.log('Top up details:', {
                toPocket: toPocket?.name,
                currentBalance: toPocket?.balance,
                amount: doc.amount,
              })

              if (toPocket) {
                const newBalance = (toPocket.balance ?? 0) + doc.amount
                await req.payload.update({
                  collection: 'pockets',
                  id: toPocketId,
                  data: {
                    balance: newBalance,
                  },
                })
                console.log(`Updated pocket ${toPocket.name} balance to ${newBalance} after top up`)
              }
            } else if (doc.transactionType === 'withdraw' && fromPocketId) {
              // Withdraw: subtract from source pocket
              const fromPocket = await req.payload.findByID({
                collection: 'pockets',
                id: fromPocketId,
              })

              console.log('Withdraw details:', {
                fromPocket: fromPocket?.name,
                currentBalance: fromPocket?.balance,
                amount: doc.amount,
              })

              if (fromPocket) {
                const newBalance = Math.max(0, (fromPocket.balance ?? 0) - doc.amount)
                await req.payload.update({
                  collection: 'pockets',
                  id: fromPocketId,
                  data: {
                    balance: newBalance,
                  },
                })
                console.log(
                  `Updated pocket ${fromPocket.name} balance to ${newBalance} after withdraw`,
                )
              }
            }
          } catch (error) {
            console.error('Error updating pocket balances:', error)
          }
        }
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        try {
          // Extract IDs from pocket objects if they are populated
          const fromPocketId =
            typeof doc.fromPocket === 'object' && doc.fromPocket?.id
              ? doc.fromPocket.id
              : doc.fromPocket

          const toPocketId =
            typeof doc.toPocket === 'object' && doc.toPocket?.id ? doc.toPocket.id : doc.toPocket

          // Reverse the pocket balance changes
          if (doc.transactionType === 'transfer' && fromPocketId && toPocketId) {
            // Reverse transfer: add back to source, subtract from destination
            const fromPocket = await req.payload.findByID({
              collection: 'pockets',
              id: fromPocketId,
            })

            const toPocket = await req.payload.findByID({
              collection: 'pockets',
              id: toPocketId,
            })

            if (fromPocket && toPocket) {
              // Reverse source pocket
              await req.payload.update({
                collection: 'pockets',
                id: fromPocketId,
                data: {
                  balance: (fromPocket.balance ?? 0) + doc.amount,
                },
              })

              // Reverse destination pocket
              await req.payload.update({
                collection: 'pockets',
                id: toPocketId,
                data: {
                  balance: Math.max(0, (toPocket.balance ?? 0) - doc.amount),
                },
              })
            }
          } else if (doc.transactionType === 'topup' && toPocketId) {
            // Reverse top up: subtract from destination pocket
            const toPocket = await req.payload.findByID({
              collection: 'pockets',
              id: toPocketId,
            })

            if (toPocket) {
              await req.payload.update({
                collection: 'pockets',
                id: toPocketId,
                data: {
                  balance: Math.max(0, (toPocket.balance ?? 0) - doc.amount),
                },
              })
            }
          } else if (doc.transactionType === 'withdraw' && fromPocketId) {
            // Reverse withdraw: add back to source pocket
            const fromPocket = await req.payload.findByID({
              collection: 'pockets',
              id: fromPocketId,
            })

            if (fromPocket) {
              await req.payload.update({
                collection: 'pockets',
                id: fromPocketId,
                data: {
                  balance: (fromPocket.balance ?? 0) + doc.amount,
                },
              })
            }
          }
        } catch (error) {
          console.error('Error reversing pocket balances after deletion:', error)
        }
      },
    ],
  },
}
