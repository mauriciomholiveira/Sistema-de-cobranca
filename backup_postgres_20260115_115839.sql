--
-- PostgreSQL database dump
--

\restrict Rh8TT5uVNpd4bpGhYTl2rKfkHLRgRC7VWlCFklwQU5rdKSXeP0F79L9es9gmWJW

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

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

ALTER TABLE IF EXISTS ONLY public.pagamentos DROP CONSTRAINT IF EXISTS pagamentos_professor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pagamentos DROP CONSTRAINT IF EXISTS pagamentos_matricula_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pagamentos DROP CONSTRAINT IF EXISTS pagamentos_curso_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pagamentos DROP CONSTRAINT IF EXISTS pagamentos_cliente_id_fkey;
ALTER TABLE IF EXISTS ONLY public.matriculas DROP CONSTRAINT IF EXISTS matriculas_professor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.matriculas DROP CONSTRAINT IF EXISTS matriculas_curso_id_fkey;
ALTER TABLE IF EXISTS ONLY public.matriculas DROP CONSTRAINT IF EXISTS matriculas_cliente_id_fkey;
ALTER TABLE IF EXISTS ONLY public.clientes DROP CONSTRAINT IF EXISTS clientes_professor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.clientes DROP CONSTRAINT IF EXISTS clientes_curso_id_fkey;
DROP INDEX IF EXISTS public.idx_pagamentos_status;
DROP INDEX IF EXISTS public.idx_pagamentos_prof;
DROP INDEX IF EXISTS public.idx_pagamentos_mes;
DROP INDEX IF EXISTS public.idx_pagamentos_cliente;
ALTER TABLE IF EXISTS ONLY public.templates_mensagem DROP CONSTRAINT IF EXISTS templates_mensagem_pkey;
ALTER TABLE IF EXISTS ONLY public.professores DROP CONSTRAINT IF EXISTS professores_pkey;
ALTER TABLE IF EXISTS ONLY public.professores DROP CONSTRAINT IF EXISTS professores_email_key;
ALTER TABLE IF EXISTS ONLY public.pagamentos DROP CONSTRAINT IF EXISTS pagamentos_pkey;
ALTER TABLE IF EXISTS ONLY public.matriculas DROP CONSTRAINT IF EXISTS matriculas_pkey;
ALTER TABLE IF EXISTS ONLY public.cursos DROP CONSTRAINT IF EXISTS cursos_pkey;
ALTER TABLE IF EXISTS ONLY public.clientes DROP CONSTRAINT IF EXISTS clientes_pkey;
ALTER TABLE IF EXISTS public.templates_mensagem ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.professores ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.pagamentos ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.matriculas ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.cursos ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.clientes ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.templates_mensagem_id_seq;
DROP TABLE IF EXISTS public.templates_mensagem;
DROP SEQUENCE IF EXISTS public.professores_id_seq;
DROP TABLE IF EXISTS public.professores;
DROP SEQUENCE IF EXISTS public.pagamentos_id_seq;
DROP TABLE IF EXISTS public.pagamentos;
DROP SEQUENCE IF EXISTS public.matriculas_id_seq;
DROP TABLE IF EXISTS public.matriculas;
DROP SEQUENCE IF EXISTS public.cursos_id_seq;
DROP TABLE IF EXISTS public.cursos;
DROP SEQUENCE IF EXISTS public.clientes_id_seq;
DROP TABLE IF EXISTS public.clientes;
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
19	Henrique	{"cep":"88132-500","logradouro":"Rua Samuel de Souza","numero":"130","complemento":"","bairro":"Passa Vinte","cidade":"Palhoça","uf":"SC"}	4896861213	10	0.00	\N	\N	0.00	0.00	t	2026-01-14 19:23:54.383502
20	Ismael	{"cep":"88010-900","logradouro":"Av. Atlantica 626 Ap","numero":"402","complemento":"","bairro":"Passa Vinte","cidade":"Palhoça","uf":"SC"}	4892078003	10	0.00	\N	\N	0.00	0.00	t	2026-01-14 19:23:54.383963
21	Lavinia	{"cep":"88133-010","logradouro":"Rua Maria Cândida dos Santos","numero":"4","complemento":"","bairro":"Passa Vinte","cidade":"Palhoça","uf":"SC"}	4891369464	10	0.00	\N	\N	0.00	0.00	t	2026-01-14 19:23:54.384454
22	Matheus	{"cep":"88132-510","logradouro":"Rua Don Afonso Niehues","numero":"389","complemento":"","bairro":"Passa Vinte","cidade":"Palhoça","uf":"SC"}	4891225387	10	0.00	\N	\N	0.00	0.00	t	2026-01-14 19:23:54.385031
23	Nathan	{"cep":"88132-440","logradouro":"Rua Dezenove de Março","numero":"200","complemento":"/ Ap 1304","bairro":"Passa Vinte","cidade":"Palhoça","uf":"SC"}	4891564558	10	0.00	\N	\N	0.00	0.00	t	2026-01-14 19:23:54.385538
1	Alice	{"cep":"88132-490","logradouro":"Servidao Manoel Antonio Vieira","numero":"61","complemento":"","bairro":"Passa Vinte","cidade":"Palhoça","uf":"SC"}	4898114035	10	0.00	\N	\N	0.00	0.00	t	2026-01-14 19:23:54.369343
2	Aminah	{"cep":"88132-490","logradouro":"Servidao Manoel Antonio Vieira","numero":"61","complemento":"","bairro":"Passa Vinte","cidade":"Palhoça","uf":"SC"}	4898114035	10	0.00	\N	\N	0.00	0.00	t	2026-01-14 19:23:54.371735
4	Danilo	{"cep":"88132-430","logradouro":"Rua Docilicio Luz","numero":"415","complemento":"","bairro":"Passa Vinte","cidade":"Palhoça","uf":"SC"}	4896163985	10	0.00	\N	\N	0.00	0.00	t	2026-01-14 19:23:54.373905
6	David	{"cep":"88132-440","logradouro":"Rua Dezenove de Março","numero":"200","complemento":"/ Ap 1304","bairro":"Passa Vinte","cidade":"Palhoça","uf":"SC"}	4891564558	10	0.00	\N	\N	0.00	0.00	t	2026-01-14 19:23:54.375336
8	Isabela	{"cep":"88132-450","logradouro":"Rua Antonio Jose Porto","numero":"8","complemento":"","bairro":"Passa Vinte","cidade":"Palhoça","uf":"SC"}	4888586721	10	0.00	\N	\N	0.00	0.00	t	2026-01-14 19:23:54.376598
9	Kleber	{"cep":"88132-460","logradouro":"Rua Araponga","numero":"169","complemento":"","bairro":"Passa Vinte","cidade":"Palhoça","uf":"SC"}	4899994329	10	0.00	\N	\N	0.00	0.00	t	2026-01-14 19:23:54.377212
3	Calleb	\N	4884278014	10	0.00	\N	\N	0.00	0.00	t	2026-01-14 19:23:54.372797
5	Davi	\N	4891124058	10	0.00	\N	\N	0.00	0.00	t	2026-01-14 19:23:54.37467
7	Henry	\N	4884474129	10	0.00	\N	\N	0.00	0.00	t	2026-01-14 19:23:54.375931
10	Claudete	\N	4899425142	10	0.00	\N	\N	0.00	0.00	t	2026-01-14 19:23:54.377786
12	Daniela	\N	4891564558	10	0.00	\N	\N	0.00	0.00	t	2026-01-14 19:23:54.379027
13	Kaira	\N	4888596403	10	0.00	\N	\N	0.00	0.00	t	2026-01-14 19:23:54.379564
14	Nicolas	\N	4891564558	10	0.00	\N	\N	0.00	0.00	t	2026-01-14 19:23:54.380089
16	Adrian	{"cep":"88132-480","logradouro":"Rua Sebastiana Ferreira de Souza","numero":"SN","complemento":"","bairro":"Passa Vinte","cidade":"Palhoça","uf":"SC"}	4888208803	10	0.00	\N	\N	0.00	0.00	t	2026-01-14 19:23:54.381105
17	Carlos	{"cep":"88132-490","logradouro":"Rua Fernando José Dutra","numero":"SN","complemento":"","bairro":"Passa Vinte","cidade":"Palhoça","uf":"SC"}	4896129937	10	0.00	\N	\N	0.00	0.00	t	2026-01-14 19:23:54.381712
18	Henri	{"cep":"88132-450","logradouro":"Rua Antonio Jose Porto","numero":"8","complemento":"","bairro":"Passa Vinte","cidade":"Palhoça","uf":"SC"}	4888586721	10	0.00	\N	\N	0.00	0.00	t	2026-01-14 19:23:54.382965
11	Claudinéia	{"cep":"88133-000","logradouro":"Rua Maria Estefana","numero":"90","complemento":"","bairro":"Rio Grande","cidade":"Palhoça","uf":"SC"}	48999006020	10	0.00	\N	\N	0.00	0.00	t	2026-01-14 19:23:54.378441
15	Tayna	{"cep":"88132-470","logradouro":"Rua João Luiz Farias","numero":"221","complemento":"","bairro":"Passa Vinte","cidade":"Palhoça","uf":"SC"}	48999613305	10	0.00	\N	\N	0.00	0.00	t	2026-01-14 19:23:54.380586
\.


--
-- Data for Name: cursos; Type: TABLE DATA; Schema: public; Owner: cobranca_user
--

COPY public.cursos (id, nome, mensalidade_padrao, active, created_at) FROM stdin;
1	Instrumento	130.00	t	2026-01-14 19:14:31.418254
2	Canto	150.00	t	2026-01-14 19:14:42.623346
\.


--
-- Data for Name: matriculas; Type: TABLE DATA; Schema: public; Owner: cobranca_user
--

COPY public.matriculas (id, cliente_id, curso_id, professor_id, dia_vencimento, valor_mensalidade, valor_professor, valor_igreja, active, created_at) FROM stdin;
1	1	1	3	10	110.00	0.00	0.00	t	2026-01-14 19:23:54.370576
2	2	1	3	10	110.00	0.00	0.00	t	2026-01-14 19:23:54.3721
3	3	1	3	10	130.00	0.00	0.00	t	2026-01-14 19:23:54.37333
4	4	1	3	10	110.00	0.00	0.00	t	2026-01-14 19:23:54.37423
5	5	1	3	10	130.00	0.00	0.00	t	2026-01-14 19:23:54.374953
6	6	1	3	10	110.00	0.00	0.00	t	2026-01-14 19:23:54.375526
7	7	1	3	10	130.00	0.00	0.00	t	2026-01-14 19:23:54.3762
8	8	1	3	10	110.00	0.00	0.00	t	2026-01-14 19:23:54.376832
9	9	1	3	10	110.00	0.00	0.00	t	2026-01-14 19:23:54.377409
16	16	1	6	10	110.00	0.00	0.00	t	2026-01-14 19:23:54.381397
17	17	1	6	10	110.00	0.00	0.00	t	2026-01-14 19:23:54.381885
18	12	1	6	10	110.00	0.00	0.00	t	2026-01-14 19:23:54.382233
19	12	1	6	10	110.00	0.00	0.00	t	2026-01-14 19:23:54.382607
20	18	1	6	10	110.00	0.00	0.00	t	2026-01-14 19:23:54.38317
21	19	1	6	10	110.00	0.00	0.00	t	2026-01-14 19:23:54.383674
22	20	1	6	10	110.00	0.00	0.00	t	2026-01-14 19:23:54.384123
23	21	1	6	10	130.00	0.00	0.00	t	2026-01-14 19:23:54.384637
24	22	1	6	10	110.00	0.00	0.00	t	2026-01-14 19:23:54.385221
25	23	1	6	10	110.00	0.00	0.00	t	2026-01-14 19:23:54.385692
10	10	2	7	10	150.00	0.00	0.00	t	2026-01-14 19:23:54.37806
11	11	2	7	10	150.00	0.00	0.00	t	2026-01-14 19:23:54.378641
12	12	2	7	10	150.00	0.00	0.00	t	2026-01-14 19:23:54.379222
13	13	2	7	10	150.00	0.00	0.00	t	2026-01-14 19:23:54.379737
14	14	2	7	10	150.00	0.00	0.00	t	2026-01-14 19:23:54.38025
15	15	2	7	10	150.00	0.00	0.00	t	2026-01-14 19:23:54.380761
\.


--
-- Data for Name: pagamentos; Type: TABLE DATA; Schema: public; Owner: cobranca_user
--

COPY public.pagamentos (id, matricula_id, cliente_id, professor_id, curso_id, mes_ref, valor_cobrado, data_vencimento, status, data_pagamento, valor_professor_recebido, valor_igreja_recebido, msg_lembrete_enviada, msg_vencimento_enviada, msg_atraso_enviada, created_at) FROM stdin;
1	1	1	3	1	2026-01	55.00	2026-01-10	PAGO	2026-01-14	50.00	5.00	f	f	f	2026-01-14 19:25:04.592728
2	2	2	3	1	2026-01	55.00	2026-01-10	PAGO	2026-01-14	50.00	5.00	f	f	f	2026-01-14 19:25:04.592728
3	3	3	3	1	2026-01	0.00	2026-01-10	ISENTO	\N	0.00	0.00	f	f	f	2026-01-14 19:25:04.592728
4	4	4	3	1	2026-01	0.00	2026-01-10	ISENTO	\N	0.00	0.00	f	f	f	2026-01-14 19:25:04.592728
5	5	5	3	1	2026-01	0.00	2026-01-10	ISENTO	\N	0.00	0.00	f	f	f	2026-01-14 19:25:04.592728
6	6	6	3	1	2026-01	110.00	2026-01-10	PAGO	2026-01-14	100.00	10.00	f	f	f	2026-01-14 19:25:04.592728
7	7	7	3	1	2026-01	0.00	2026-01-10	ISENTO	\N	0.00	0.00	f	f	f	2026-01-14 19:25:04.592728
8	8	8	3	1	2026-01	55.00	2026-01-10	PAGO	2026-01-14	50.00	5.00	f	f	f	2026-01-14 19:25:04.592728
9	9	9	3	1	2026-01	55.00	2026-01-10	PAGO	2026-01-14	50.00	5.00	f	f	f	2026-01-14 19:25:04.592728
20	10	10	7	2	2026-01	150.00	2026-01-10	PAGO	2026-01-14	135.00	15.00	f	f	f	2026-01-14 19:25:04.592728
21	11	11	7	2	2026-01	150.00	2026-01-10	PAGO	2026-01-14	135.00	15.00	f	f	f	2026-01-14 19:25:04.592728
22	12	12	7	2	2026-01	150.00	2026-01-10	PAGO	2026-01-14	135.00	15.00	f	f	f	2026-01-14 19:25:04.592728
23	13	13	7	2	2026-01	0.00	2026-01-10	ISENTO	\N	0.00	0.00	f	f	f	2026-01-14 19:25:04.592728
24	14	14	7	2	2026-01	150.00	2026-01-10	PAGO	2026-01-14	135.00	15.00	f	f	f	2026-01-14 19:25:04.592728
25	15	15	7	2	2026-01	150.00	2026-01-10	PAGO	2026-01-14	135.00	15.00	f	f	f	2026-01-14 19:25:04.592728
10	16	16	6	1	2026-01	110.00	2026-01-10	PAGO	2026-01-14	100.00	10.00	f	f	f	2026-01-14 19:25:04.592728
11	17	17	6	1	2026-01	110.00	2026-01-10	PAGO	2026-01-14	100.00	10.00	f	f	f	2026-01-14 19:25:04.592728
12	18	12	6	1	2026-01	110.00	2026-01-10	PAGO	2026-01-14	100.00	10.00	f	f	f	2026-01-14 19:25:04.592728
13	19	12	6	1	2026-01	110.00	2026-01-10	PAGO	2026-01-14	100.00	10.00	f	f	f	2026-01-14 19:25:04.592728
14	20	18	6	1	2026-01	0.00	2026-01-10	ISENTO	\N	0.00	0.00	f	f	f	2026-01-14 19:25:04.592728
15	21	19	6	1	2026-01	110.00	2026-01-10	PAGO	2026-01-14	100.00	10.00	f	f	f	2026-01-14 19:25:04.592728
16	22	20	6	1	2026-01	110.00	2026-01-10	PAGO	2026-01-14	100.00	10.00	f	f	f	2026-01-14 19:25:04.592728
17	23	21	6	1	2026-01	130.00	2026-01-10	PAGO	2026-01-14	100.00	30.00	f	f	f	2026-01-14 19:25:04.592728
18	24	22	6	1	2026-01	110.00	2026-01-10	PAGO	2026-01-14	100.00	10.00	f	f	f	2026-01-14 19:25:04.592728
19	25	23	6	1	2026-01	110.00	2026-01-10	PAGO	2026-01-14	100.00	10.00	f	f	f	2026-01-14 19:25:04.592728
\.


--
-- Data for Name: professores; Type: TABLE DATA; Schema: public; Owner: cobranca_user
--

COPY public.professores (id, nome, email, senha, whatsapp, cpf, pix, data_nascimento, contato, endereco, dados_bancarios, active, is_admin, can_send_messages, created_at) FROM stdin;
1	Administrador	admin@email.com	123	\N	\N	\N	\N	\N	\N	\N	t	t	f	2026-01-14 18:58:00.023269
2	Mauricio Oliveira	mauriciomholiveira@icloud.com	123	\N	\N	\N	\N	\N	\N	\N	t	t	f	2026-01-14 18:59:58.73754
3	Aber		\N	4896030597	\N	12973993903	\N	\N	{"cep":"","logradouro":"","numero":"","complemento":"","bairro":"","cidade":"","uf":""}	{"banco":"","agencia":"","conta":"","tipo_conta":"Corrente"}	t	f	f	2026-01-14 19:10:12.186917
6	Alexandre	\N	\N	4898507027	\N	10199724911	\N	\N	{"cep":"","logradouro":"","numero":"","complemento":"","bairro":"","cidade":"","uf":""}	{"banco":"","agencia":"","conta":"","tipo_conta":"Corrente"}	t	f	f	2026-01-14 19:12:10.035659
7	Alex	\N	\N	4891063713	\N	6899884678	\N	\N	{"cep":"","logradouro":"","numero":"","complemento":"","bairro":"","cidade":"","uf":""}	{"banco":"","agencia":"","conta":"","tipo_conta":"Corrente"}	t	f	f	2026-01-14 19:12:44.258312
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

SELECT pg_catalog.setval('public.clientes_id_seq', 23, true);


--
-- Name: cursos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cobranca_user
--

SELECT pg_catalog.setval('public.cursos_id_seq', 2, true);


--
-- Name: matriculas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cobranca_user
--

SELECT pg_catalog.setval('public.matriculas_id_seq', 25, true);


--
-- Name: pagamentos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cobranca_user
--

SELECT pg_catalog.setval('public.pagamentos_id_seq', 25, true);


--
-- Name: professores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cobranca_user
--

SELECT pg_catalog.setval('public.professores_id_seq', 7, true);


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

\unrestrict Rh8TT5uVNpd4bpGhYTl2rKfkHLRgRC7VWlCFklwQU5rdKSXeP0F79L9es9gmWJW

