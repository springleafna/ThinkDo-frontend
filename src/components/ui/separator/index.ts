import { cva, type VariantProps } from 'class-variance-authority'

export { default as Separator } from './Separator.vue'

export const separatorVariants = cva(
  'shrink-0 bg-black/10',
  {
    variants: {
      orientation: {
        horizontal: 'h-px w-full',
        vertical: 'h-full w-px'
      }
    },
    defaultVariants: {
      orientation: 'horizontal'
    }
  }
)

export type SeparatorProps = {
  class?: string
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
}
