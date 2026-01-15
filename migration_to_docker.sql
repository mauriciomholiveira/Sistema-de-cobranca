--
-- PostgreSQL database dump
--

\restrict MrhGLvbEli9oqlQOeR2rkHiMw1FmHGZbaqrTfkHKoEAWPvIbduhcXs4wzQlLLma

-- Dumped from database version 15.15 (Homebrew)
-- Dumped by pg_dump version 15.15 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clientes; Type: TABLE; Schema: public; Owner: cobranca_user
--

CREATE TABLE public.clientes (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    endereco text,
    whatsapp character varying(20) NOT NULL,
    dia_vencimento integer DEFAULT 10,
    valor_padrao numeric(10,2) DEFAULT 0.00,
    professor_id integer,
    curso_id integer,
    valor_professor numeric(10,2) DEFAULT 0.00,
    valor_igreja numeric(10,2) DEFAULT 0.00,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.clientes OWNER TO cobranca_user;

--
-- Name: clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: cobranca_user
--

CREATE SEQUENCE public.clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.clientes_id_seq OWNER TO cobranca_user;

--
-- Name: clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cobranca_user
--

ALTER SEQUENCE public.clientes_id_seq OWNED BY public.clientes.id;


--
-- Name: cursos; Type: TABLE; Schema: public; Owner: cobranca_user
--

CREATE TABLE public.cursos (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    mensalidade_padrao numeric(10,2),
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cursos OWNER TO cobranca_user;

--
-- Name: cursos_id_seq; Type: SEQUENCE; Schema: public; Owner: cobranca_user
--

CREATE SEQUENCE public.cursos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cursos_id_seq OWNER TO cobranca_user;

--
-- Name: cursos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cobranca_user
--

ALTER SEQUENCE public.cursos_id_seq OWNED BY public.cursos.id;


--
-- Name: matriculas; Type: TABLE; Schema: public; Owner: cobranca_user
--

CREATE TABLE public.matriculas (
    id integer NOT NULL,
    cliente_id integer,
    curso_id integer,
    professor_id integer,
    dia_vencimento integer,
    valor_mensalidade numeric(10,2),
    valor_professor numeric(10,2),
    valor_igreja numeric(10,2),
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.matriculas OWNER TO cobranca_user;

--
-- Name: matriculas_id_seq; Type: SEQUENCE; Schema: public; Owner: cobranca_user
--

CREATE SEQUENCE public.matriculas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.matriculas_id_seq OWNER TO cobranca_user;

--
-- Name: matriculas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cobranca_user
--

ALTER SEQUENCE public.matriculas_id_seq OWNED BY public.matriculas.id;


--
-- Name: pagamentos; Type: TABLE; Schema: public; Owner: cobranca_user
--

CREATE TABLE public.pagamentos (
    id integer NOT NULL,
    matricula_id integer,
    cliente_id integer,
    professor_id integer,
    curso_id integer,
    mes_ref character varying(7) NOT NULL,
    valor_cobrado numeric(10,2) NOT NULL,
    data_vencimento date NOT NULL,
    status character varying(20) DEFAULT 'PENDENTE'::character varying,
    data_pagamento date,
    valor_professor_recebido numeric(10,2) DEFAULT 0,
    valor_igreja_recebido numeric(10,2) DEFAULT 0,
    msg_lembrete_enviada boolean DEFAULT false,
    msg_vencimento_enviada boolean DEFAULT false,
    msg_atraso_enviada boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pagamentos OWNER TO cobranca_user;

--
-- Name: pagamentos_id_seq; Type: SEQUENCE; Schema: public; Owner: cobranca_user
--

CREATE SEQUENCE public.pagamentos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pagamentos_id_seq OWNER TO cobranca_user;

--
-- Name: pagamentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cobranca_user
--

ALTER SEQUENCE public.pagamentos_id_seq OWNED BY public.pagamentos.id;


--
-- Name: professores; Type: TABLE; Schema: public; Owner: cobranca_user
--

CREATE TABLE public.professores (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    email character varying(255),
    senha character varying(255),
    whatsapp character varying(20),
    cpf character varying(20),
    pix character varying(255),
    data_nascimento date,
    contato character varying(100),
    endereco text,
    dados_bancarios text,
    active boolean DEFAULT true,
    is_admin boolean DEFAULT false,
    can_send_messages boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.professores OWNER TO cobranca_user;

--
-- Name: professores_id_seq; Type: SEQUENCE; Schema: public; Owner: cobranca_user
--

CREATE SEQUENCE public.professores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.professores_id_seq OWNER TO cobranca_user;

--
-- Name: professores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cobranca_user
--

ALTER SEQUENCE public.professores_id_seq OWNED BY public.professores.id;


--
-- Name: templates_mensagem; Type: TABLE; Schema: public; Owner: cobranca_user
--

CREATE TABLE public.templates_mensagem (
    id integer NOT NULL,
    titulo character varying(100) NOT NULL,
    conteudo text NOT NULL
);


ALTER TABLE public.templates_mensagem OWNER TO cobranca_user;

--
-- Name: templates_mensagem_id_seq; Type: SEQUENCE; Schema: public; Owner: cobranca_user
--

CREATE SEQUENCE public.templates_mensagem_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.templates_mensagem_id_seq OWNER TO cobranca_user;

--
-- Name: templates_mensagem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cobranca_user
--

ALTER SEQUENCE public.templates_mensagem_id_seq OWNED BY public.templates_mensagem.id;


--
-- Name: clientes id; Type: DEFAULT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.clientes ALTER COLUMN id SET DEFAULT nextval('public.clientes_id_seq'::regclass);


--
-- Name: cursos id; Type: DEFAULT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.cursos ALTER COLUMN id SET DEFAULT nextval('public.cursos_id_seq'::regclass);


--
-- Name: matriculas id; Type: DEFAULT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.matriculas ALTER COLUMN id SET DEFAULT nextval('public.matriculas_id_seq'::regclass);


--
-- Name: pagamentos id; Type: DEFAULT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.pagamentos ALTER COLUMN id SET DEFAULT nextval('public.pagamentos_id_seq'::regclass);


--
-- Name: professores id; Type: DEFAULT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.professores ALTER COLUMN id SET DEFAULT nextval('public.professores_id_seq'::regclass);


--
-- Name: templates_mensagem id; Type: DEFAULT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.templates_mensagem ALTER COLUMN id SET DEFAULT nextval('public.templates_mensagem_id_seq'::regclass);


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: cobranca_user
--

COPY public.clientes (id, nome, endereco, whatsapp, dia_vencimento, valor_padrao, professor_id, curso_id, valor_professor, valor_igreja, active, created_at) FROM stdin;
\.


--
-- Data for Name: cursos; Type: TABLE DATA; Schema: public; Owner: cobranca_user
--

COPY public.cursos (id, nome, mensalidade_padrao, active, created_at) FROM stdin;
\.


--
-- Data for Name: matriculas; Type: TABLE DATA; Schema: public; Owner: cobranca_user
--

COPY public.matriculas (id, cliente_id, curso_id, professor_id, dia_vencimento, valor_mensalidade, valor_professor, valor_igreja, active, created_at) FROM stdin;
\.


--
-- Data for Name: pagamentos; Type: TABLE DATA; Schema: public; Owner: cobranca_user
--

COPY public.pagamentos (id, matricula_id, cliente_id, professor_id, curso_id, mes_ref, valor_cobrado, data_vencimento, status, data_pagamento, valor_professor_recebido, valor_igreja_recebido, msg_lembrete_enviada, msg_vencimento_enviada, msg_atraso_enviada, created_at) FROM stdin;
\.


--
-- Data for Name: professores; Type: TABLE DATA; Schema: public; Owner: cobranca_user
--

COPY public.professores (id, nome, email, senha, whatsapp, cpf, pix, data_nascimento, contato, endereco, dados_bancarios, active, is_admin, can_send_messages, created_at) FROM stdin;
1	Administrador	admin@email.com	123	\N	\N	\N	\N	\N	\N	\N	t	t	f	2026-01-14 15:48:07.608288
\.


--
-- Data for Name: templates_mensagem; Type: TABLE DATA; Schema: public; Owner: cobranca_user
--

COPY public.templates_mensagem (id, titulo, conteudo) FROM stdin;
1	Cobrança Padrão	Olá {nome}, tudo bem? Passando para lembrar da sua mensalidade referente a {mes} no valor de R$ {valor}.
2	Em Atraso	Olá {nome}. Consta em nosso sistema uma pendência referente a {mes}. Valor atualizado: R$ {valor}. Podemos regularizar?
\.


--
-- Name: clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cobranca_user
--

SELECT pg_catalog.setval('public.clientes_id_seq', 1, false);


--
-- Name: cursos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cobranca_user
--

SELECT pg_catalog.setval('public.cursos_id_seq', 1, false);


--
-- Name: matriculas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cobranca_user
--

SELECT pg_catalog.setval('public.matriculas_id_seq', 1, false);


--
-- Name: pagamentos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cobranca_user
--

SELECT pg_catalog.setval('public.pagamentos_id_seq', 1, false);


--
-- Name: professores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cobranca_user
--

SELECT pg_catalog.setval('public.professores_id_seq', 1, true);


--
-- Name: templates_mensagem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cobranca_user
--

SELECT pg_catalog.setval('public.templates_mensagem_id_seq', 2, true);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: cursos cursos_pkey; Type: CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.cursos
    ADD CONSTRAINT cursos_pkey PRIMARY KEY (id);


--
-- Name: matriculas matriculas_pkey; Type: CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.matriculas
    ADD CONSTRAINT matriculas_pkey PRIMARY KEY (id);


--
-- Name: pagamentos pagamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_pkey PRIMARY KEY (id);


--
-- Name: professores professores_email_key; Type: CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.professores
    ADD CONSTRAINT professores_email_key UNIQUE (email);


--
-- Name: professores professores_pkey; Type: CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.professores
    ADD CONSTRAINT professores_pkey PRIMARY KEY (id);


--
-- Name: templates_mensagem templates_mensagem_pkey; Type: CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.templates_mensagem
    ADD CONSTRAINT templates_mensagem_pkey PRIMARY KEY (id);


--
-- Name: idx_pagamentos_cliente; Type: INDEX; Schema: public; Owner: cobranca_user
--

CREATE INDEX idx_pagamentos_cliente ON public.pagamentos USING btree (cliente_id);


--
-- Name: idx_pagamentos_mes; Type: INDEX; Schema: public; Owner: cobranca_user
--

CREATE INDEX idx_pagamentos_mes ON public.pagamentos USING btree (mes_ref);


--
-- Name: idx_pagamentos_prof; Type: INDEX; Schema: public; Owner: cobranca_user
--

CREATE INDEX idx_pagamentos_prof ON public.pagamentos USING btree (professor_id);


--
-- Name: idx_pagamentos_status; Type: INDEX; Schema: public; Owner: cobranca_user
--

CREATE INDEX idx_pagamentos_status ON public.pagamentos USING btree (status);


--
-- Name: clientes clientes_curso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id);


--
-- Name: clientes clientes_professor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.professores(id);


--
-- Name: matriculas matriculas_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.matriculas
    ADD CONSTRAINT matriculas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: matriculas matriculas_curso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.matriculas
    ADD CONSTRAINT matriculas_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id);


--
-- Name: matriculas matriculas_professor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.matriculas
    ADD CONSTRAINT matriculas_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.professores(id);


--
-- Name: pagamentos pagamentos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: pagamentos pagamentos_curso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id);


--
-- Name: pagamentos pagamentos_matricula_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_matricula_id_fkey FOREIGN KEY (matricula_id) REFERENCES public.matriculas(id);


--
-- Name: pagamentos pagamentos_professor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.professores(id);


--
-- PostgreSQL database dump complete
--

\unrestrict MrhGLvbEli9oqlQOeR2rkHiMw1FmHGZbaqrTfkHKoEAWPvIbduhcXs4wzQlLLma

