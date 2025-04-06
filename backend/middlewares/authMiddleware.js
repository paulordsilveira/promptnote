export const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    console.log('Aviso: Requisição sem autenticação, permitindo acesso para teste');
    // Criar um usuário temporário para testes
    req.session.user = { 
      id: 1, 
      email: 'usuario_teste@exemplo.com',
      name: 'Usuário Teste' 
    };
    next();
    return;
  }
  next();
}; 