import { describe, expect, it } from 'vitest'
import { DIAS_DA_SEMANA_ABREVIADOS, montarGradeDoMes } from './calendario'

describe('montarGradeDoMes', () => {
  it('setembro de 2026 começa numa terça: a primeira semana traz o fim de agosto', () => {
    const grade = montarGradeDoMes('2026-09')

    expect(grade[0].map((dia) => dia.dataIso)).toEqual([
      '2026-08-30',
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05'
    ])
    expect(grade[0].map((dia) => dia.doMesExibido)).toEqual([
      false,
      false,
      true,
      true,
      true,
      true,
      true
    ])
  })

  it('toda semana tem 7 dias e a grade começa no domingo', () => {
    for (const mes of ['2026-02', '2026-09', '2027-01', '2028-02']) {
      const grade = montarGradeDoMes(mes)

      expect(grade.every((semana) => semana.length === 7)).toBe(true)
      expect(new Date(`${grade[0][0].dataIso}T00:00:00Z`).getUTCDay()).toBe(0)
    }
  })

  it('cobre o mês inteiro, cada dia uma única vez', () => {
    const diasDoMes = montarGradeDoMes('2026-09')
      .flat()
      .filter((dia) => dia.doMesExibido)

    expect(diasDoMes.map((dia) => dia.diaDoMes)).toEqual(
      Array.from({ length: 30 }, (_, indice) => indice + 1)
    )
  })

  it('fevereiro de 2026 começa num domingo e cabe em exatamente 4 semanas', () => {
    const grade = montarGradeDoMes('2026-02')

    expect(grade).toHaveLength(4)
    expect(grade.flat().every((dia) => dia.doMesExibido)).toBe(true)
  })

  it('a última semana termina no sábado, com dias do mês seguinte', () => {
    const ultima = montarGradeDoMes('2026-09').at(-1) ?? []

    expect(ultima.at(-1)?.dataIso).toBe('2026-10-03')
    expect(ultima.at(-1)?.doMesExibido).toBe(false)
  })

  it('funciona na virada do ano e em ano bissexto', () => {
    expect(montarGradeDoMes('2026-12').flat().at(-1)?.dataIso).toBe('2027-01-02')
    expect(
      montarGradeDoMes('2028-02')
        .flat()
        .some((dia) => dia.dataIso === '2028-02-29' && dia.doMesExibido)
    ).toBe(true)
  })
})

describe('DIAS_DA_SEMANA_ABREVIADOS', () => {
  it('tem uma letra para cada dia, começando no domingo', () => {
    expect(DIAS_DA_SEMANA_ABREVIADOS).toHaveLength(7)
    expect(DIAS_DA_SEMANA_ABREVIADOS[0]).toBe('D')
  })
})
