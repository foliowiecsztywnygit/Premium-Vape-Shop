import { getPrisma } from '../../server/prisma.js'

export async function getPosSettings({ storeId, provider }) {
  const prisma = getPrisma()
  const data = await prisma.posSetting.findUnique({
    where: {
      storeId_posProvider: {
        storeId,
        posProvider: provider,
      },
    },
  })
  if (!data) throw new Error('POS settings not found')
  return data
}
