export default function Footer() {
  return (
    <footer className="w-full py-4 px-6 flex justify-end">
      <p className="text-xs text-white/30">
        &copy; {new Date().getFullYear()} AETHER Audio. All rights reserved.
      </p>
    </footer>
  );
}
