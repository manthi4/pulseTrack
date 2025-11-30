import { describe, it, expect } from 'vitest'
import { render, screen } from '../../test/utils'
import { Button } from './Button'
import userEvent from '@testing-library/user-event'

describe('Button', () => {
    it('should render with default variant', () => {
        render(<Button>Click me</Button>)
        const button = screen.getByRole('button', { name: /click me/i })
        expect(button).toBeInTheDocument()
    })

    it('should render with destructive variant', () => {
        render(<Button variant="destructive">Delete</Button>)
        const button = screen.getByRole('button', { name: /delete/i })
        expect(button).toBeInTheDocument()
        expect(button.className).toContain('destructive')
    })

    it('should render with outline variant', () => {
        render(<Button variant="outline">Outline</Button>)
        const button = screen.getByRole('button', { name: /outline/i })
        expect(button.className).toContain('outline')
    })

    it('should render with secondary variant', () => {
        render(<Button variant="secondary">Secondary</Button>)
        const button = screen.getByRole('button', { name: /secondary/i })
        expect(button.className).toContain('secondary')
    })

    it('should render with ghost variant', () => {
        render(<Button variant="ghost">Ghost</Button>)
        const button = screen.getByRole('button', { name: /ghost/i })
        expect(button.className).toContain('hover:bg-accent')
    })

    it('should render with link variant', () => {
        render(<Button variant="link">Link</Button>)
        const button = screen.getByRole('button', { name: /link/i })
        expect(button.className).toContain('underline-offset-4')
    })

    it('should render with small size', () => {
        render(<Button size="sm">Small</Button>)
        const button = screen.getByRole('button', { name: /small/i })
        expect(button.className).toContain('h-9')
    })

    it('should render with large size', () => {
        render(<Button size="lg">Large</Button>)
        const button = screen.getByRole('button', { name: /large/i })
        expect(button.className).toContain('h-11')
    })

    it('should render with icon size', () => {
        render(<Button size="icon" aria-label="Icon button">X</Button>)
        const button = screen.getByRole('button', { name: /icon button/i })
        expect(button.className).toContain('h-10')
        expect(button.className).toContain('w-10')
    })

    it('should handle click events', async () => {
        const user = userEvent.setup()
        let clicked = false
        const handleClick = () => { clicked = true }

        render(<Button onClick={handleClick}>Click me</Button>)
        const button = screen.getByRole('button', { name: /click me/i })

        await user.click(button)
        expect(clicked).toBe(true)
    })

    it('should apply custom className', () => {
        render(<Button className="custom-class">Custom</Button>)
        const button = screen.getByRole('button', { name: /custom/i })
        expect(button.className).toContain('custom-class')
    })

    it('should be disabled when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>)
        const button = screen.getByRole('button', { name: /disabled/i })
        expect(button).toBeDisabled()
    })

    it('should render with type attribute', () => {
        render(<Button type="submit">Submit</Button>)
        const button = screen.getByRole('button', { name: /submit/i })
        expect(button).toHaveAttribute('type', 'submit')
    })

    it('should support asChild prop', () => {
        render(
            <Button asChild>
                <a href="/test">Link Button</a>
            </Button>
        )
        const link = screen.getByRole('link', { name: /link button/i })
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', '/test')
    })
})
