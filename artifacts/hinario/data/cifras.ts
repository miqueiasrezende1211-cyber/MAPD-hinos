export const cifras: Record<number, string> = {
  488: `            A     E/G#              F#m
Eu posso estar enfermo, mas sigo crendo
    D             A            E      E/G#
Eu sei vou ser curado em nome de Jesus
      A         E/G#            F#m
O inimigo tem tentado roubar minha herança
      D                C#m         E
E as bençãos que o Senhor me prometeu
       D                       C#m
As promessas do Senhor jamais irão falhar
         D             B7         E
Minha vitória hoje eu posso confessar

(Coro)
   A        D              A
A pomba pousou em meu coração
          A            D                E
Tem me guiado pelas tormentas, sim eu creio
           A             D                         C#m      F#m
Ele tem me elevado mais alto pra crer no que tens feito por mim
         Bm                   E          D/F#   E/G#
Sou uma águia a voar sobre as águas (turbulentas)
 A         D         C#m  F#7
Sinto o mover de Suas asas
   Bm       E          F#m  B7
A pomba pousou em meu coração
        D              E              A E
Sim eu creio Cristo está, em meu coração

            A     E/G#         F#m
Eu posso estar aflito e dilacerado
           D          C#m           E
Ainda que tenha cicatrizes não vou desistir
      A          E/G#           F#m
Ele prometeu me libertar da escravidão
        D      C#m        E
Sua promessa jamais falhará
   D                      C#m
O que preciso Ele tem provido
 D          Bm            E  E/G#
Sempre que clamo por Seu nome`,

  679: `    C
 A luz deste dia chegou
    F            C#º     Dm
 Levanta-te vem resplandecer
         G                 C
 Porque agora, o tempo acabou
          C      G         C
 Porque agora a luz já chegou

    C
 A luz deste dia chegou
    F            C#º     Dm
 Levanta-te vem resplandecer
         G                 C
 Porque agora, o tempo acabou
          C      G         C
 Porque agora a luz já chegou

        G                     F                 C
 A verdadeira igreja do Deus vivo está pegando fogo
           G          F                C
 Porque a luz do evangelho está vivificando em nós
             G           F                  C
 Fomos escolhidos para crermos na santa convocação
          Dm             Em
 O grande ima tem nos atraído
        D/F#    Dm      G   C
 Pelo poder, poder vivificador

             G                F             C
 Estamos recebendo o mesmo espírito do mensageiro
              G          F                   C
 Foi este o grão amadurecido, Desta era o primeiro
             G          F                C
 Fomos escolhidos para sermos como esse mesmo grão
          Dm            Em                D/F#
 Este é o dia, está é a hora, sim daremos luz
          Dm             G        C
 Está chegando a nossa transformação`,
};

export function temCifra(numero: number): boolean {
  return Object.prototype.hasOwnProperty.call(cifras, numero);
}
