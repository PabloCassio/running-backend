-- Script de inicialização do banco de dados para o Maratona Ao Vivo
-- Este script é executado automaticamente quando o container PostgreSQL é iniciado

-- Concede permissões ao usuário maratona_user no banco de desenvolvimento
GRANT ALL PRIVILEGES ON DATABASE maratona_db TO maratona_user;

-- Conecta ao banco de dados de desenvolvimento
\c maratona_db

-- Concede permissões no schema público
GRANT ALL ON SCHEMA public TO maratona_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO maratona_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO maratona_user;

-- Configurações de timezone
ALTER DATABASE maratona_db SET timezone TO 'America/Sao_Paulo';

-- Banco exclusivo para testes (isolado do banco de desenvolvimento)
CREATE DATABASE maratona_test OWNER maratona_user;

-- Concede permissões ao usuário maratona_user no banco de testes
GRANT ALL PRIVILEGES ON DATABASE maratona_test TO maratona_user;

-- Conecta ao banco de testes e concede permissões no schema público
\c maratona_test

GRANT ALL ON SCHEMA public TO maratona_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO maratona_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO maratona_user;

ALTER DATABASE maratona_test SET timezone TO 'America/Sao_Paulo';

-- Comentário sobre o banco de dados
COMMENT ON DATABASE maratona_db IS 'Banco de dados do sistema Maratona Ao Vivo - Competições de running online em tempo real';