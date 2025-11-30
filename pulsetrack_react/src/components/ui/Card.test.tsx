import { describe, it, expect } from 'vitest'
import { render, screen } from '../../test/utils'
import { Card } from './Card'
import userEvent from '@testing-library/user-event'

describe('Card', () => {
    it('should render children correctly', () => {
        render(<Card>Card Content</Card>)
        expect(screen.getByText('Card Content')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
        const { container } = render(<Card className="custom-card">Content</Card>)
        const card = container.firstChild as HTMLElement
        expect(card.className).toContain('custom-card')
    })

    it('should render with default medium padding', () => {
        const { container } = render(<Card>Content</Card>)
        const card = container.firstChild as HTMLElement
        expect(card.className).toContain('p-6')
    })

    it('should render with small padding', () => {
        const { container } = render(<Card padding="sm">Content</Card>)
        const card = container.firstChild as HTMLElement
        expect(card.className).toContain('p-4')
    })

    it('should render with large padding', () => {
        const { container } = render(<Card padding="lg">Content</Card>)
        const card = container.firstChild as HTMLElement
        expect(card.className).toContain('p-8')
    })

    it('should apply hover effectwhen hover prop is true', () => {
        const { container } = render(<Card hover>Content</Card>)
        const card = container.firstChild as HTMLElement
        expect(card.className).toContain('hover:shadow-xl')
    })

    it('should not apply hover effect by default', () => {
        const { container } = render(<Card>Content</Card>)
        const card = container.firstChild as HTMLElement
        expect(card.className).not.toContain('hover:shadow-xl')
    })

    it('should handle click events', async () => {
        const user = userEvent.setup()
        let clicked = false
        const handleClick = () => { clicked = true }

        const { container } = render(<Card onClick={handleClick}>Click me</Card>)
        const card = container.firstChild as HTMLElement

        await user.click(card)
        expect(clicked).toBe(true)
    })

    it('should render complex children', () => {
        render(
            <Card>
                <h2>Title</h2>
                <p>Description</p>
                <button>Action</button>
            </Card>
        )

        expect(screen.getByText('Title')).toBeInTheDocument()
        expect(screen.getByText('Description')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument()
    })
})
