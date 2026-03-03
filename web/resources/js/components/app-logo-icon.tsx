export default function AppLogoIcon({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { className?: string }) {
    return (
        <img
            src="/docklands.png"
            alt="Docklands Accountants"
            className={className}
            style={{ objectFit: 'contain' }}
            {...props}
        />
    );
}
