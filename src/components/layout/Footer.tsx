
const Footer = () => {
  return (
    <footer className="bg-muted text-muted-foreground py-6 text-center">
      <div className="container mx-auto px-4">
        <p>&copy; {new Date().getFullYear()} Controle de Doces. Todos os direitos reservados.</p>
        <p className="text-sm mt-1">Feito com <span role="img" aria-label="banana">🍌</span> e carinho.</p>
      </div>
    </footer>
  );
};

export default Footer;
