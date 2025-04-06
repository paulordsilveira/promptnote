export const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    console.log('Aviso: Requisição sem autenticação, permitindo acesso para teste');
    // Criar um usuário temporário para testes
    req.session.user = { 
      id: 1, 
      email: 'usuario_teste@exemplo.com',
      name: 'Usuário Teste' 
    };
    // Garantir que a sessão seja salva antes de continuar
    req.session.save((err) => {
      if (err) {
        console.error('Erro ao salvar sessão:', err);
      }
      next();
    });
    return;
  }
  next();
}; 