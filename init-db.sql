-- Script de inicialização do banco de dados para o Maratona Ao Vivo
-- Este script é executado automaticamente quando o container PostgreSQL é iniciado

-- Concede permissões ao usuário maratona_user
GRANT ALL PRIVILEGES ON DATABASE maratona_db TO maratona_user;

-- Conecta ao banco de dados maratona_db
\c maratona_db

-- Concede permissões no schema público
GRANT ALL ON SCHEMA public TO maratona_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO maratona_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO maratona_user;

-- Configurações adicionais (opcional)
ALTER DATABASE maratona_db SET timezone TO 'America/Sao_Paulo';

-- Comentário sobre o banco de dados
COMMENT ON DATABASE maratona_db IS 'Banco de dados do sistema Maratona Ao Vivo - Competições de running online em tempo real';