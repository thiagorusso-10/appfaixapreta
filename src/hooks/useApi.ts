import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/lib/supabase/client';
import { Student, Payment, CheckIn, ClassSession, Plan, BeltRank, PaymentStatus, PaymentMethod, Turma, StudentTechnique } from '@/lib/types';
import { useAuth } from '@clerk/nextjs';

export function useApi(academyId?: string) {
  const supabase = useSupabase();
  const { isLoaded, isSignedIn } = useAuth();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [lessonPlans, setLessonPlans] = useState<any[]>([]);
  const [studentTechniques, setStudentTechniques] = useState<StudentTechnique[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchData = useCallback(async () => {
    if (!academyId || !isLoaded) {
      if (isLoaded) setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Como o RLS está ativo, só podemos buscar os dados que o usuário tem acesso.
      // E por garantia, passamos eq('academy_id', academyId).
      const [
        studentsResult,
        { data: paymentsData },
        { data: checkinsData },
        { data: classesData },
        { data: plansData },
        { data: turmasData },
        { data: lessonPlansData },
        { data: studentTechniquesData },
      ] = await Promise.all([
        supabase.from('students').select('*').eq('academy_id', academyId),
        supabase.from('payments').select('*').eq('academy_id', academyId),
        supabase.from('checkins').select('*').eq('academy_id', academyId),
        supabase.from('class_sessions').select('*').eq('academy_id', academyId),
        supabase.from('plans').select('*').eq('academy_id', academyId),
        supabase.from('turmas').select('*').eq('academy_id', academyId),
        supabase.from('lesson_plans').select('*').eq('academy_id', academyId),
        supabase.from('student_techniques').select('*').eq('academy_id', academyId)
      ]);

      const studentsData = studentsResult.data;

      // Mapeamento dos campos snake_case do banco para camelCase do TypeScript
      const mappedStudents: Student[] = (studentsData || []).map((s: any) => ({
        id: s.id,
        academyId: s.academy_id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        birthDate: s.birth_date,
        documentNumber: s.document_number,
        beltRank: s.belt_rank as BeltRank,
        status: s.status as any,
        classesAttendedToNextRank: s.classes_attended || 0,
        classesTargetForNextRank: s.classes_required_for_next_belt || 30,
        medicalRestrictions: s.medical_notes,
        professorNotes: s.professor_notes,
        checkinBlocked: s.checkin_blocked || false,
        checkinBlockReason: s.checkin_block_reason,
        role: "ALUNO" as any,
        modality: s.modality || "Judô",
        lastGraduationDate: s.created_at,
        isReadyForExam: s.is_ready_for_exam || false,
        beltDegree: s.belt_degree || 0,
        avatarUrl: s.avatar_url,
        isExemptFromPayment: s.is_exempt || false,
        turmaId: s.turma_id || undefined,
        planId: s.plan_id || undefined,
      }));

      const mappedPayments: Payment[] = (paymentsData || []).map((p: any) => ({
        id: p.id,
        academyId: p.academy_id,
        studentId: p.student_id,
        amount: Number(p.amount),
        description: p.description,
        status: p.status as PaymentStatus,
        dueDate: p.due_date,
        paidDate: p.payment_date,
        method: "PIX" as PaymentMethod, // Ajustar depois se colocar na tabela
      }));

      const mappedCheckins: CheckIn[] = (checkinsData || []).map((c: any) => ({
        id: c.id,
        studentId: c.student_id,
        classSessionId: "c1", // Fake até implementar classes_sessions no banco
        timestamp: c.created_at,
      }));

      setStudents(mappedStudents);
      setPayments(mappedPayments);
      setCheckins(mappedCheckins);
      
      const mappedClasses: ClassSession[] = (classesData || []).map((c: any) => ({
        id: c.id,
        academyId: c.academy_id,
        modality: c.modality,
        level: c.level,
        weekDay: c.week_day,
        time: c.time,
        maxStudents: c.max_students,
        techniqueOfTheDayId: c.technique_of_the_day_id
      }));

      const mappedPlans: Plan[] = (plansData || []).map((p: any) => ({
        id: p.id,
        academyId: p.academy_id,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        recurring: p.recurring,
        classesPerWeek: p.classes_per_week,
        features: p.features || [],
        isPopular: p.is_popular,
        defaultBillingDay: p.default_billing_day,
      }));

      const mappedTurmas: Turma[] = (turmasData || []).map((t: any) => ({
        id: t.id,
        academyId: t.academy_id,
        name: t.name,
        schedule: t.schedule,
        professor: t.professor,
      }));

      const mappedLessonPlans = (lessonPlansData || []).map((lp: any) => ({
        id: lp.id,
        academyId: lp.academy_id,
        turmaId: lp.turma_id,
        classSessionId: lp.class_session_id,
        date: lp.date,
        title: lp.title,
        content: lp.content,
        observations: lp.observations,
        createdAt: lp.created_at,
      }));

      const mappedTechniques: StudentTechnique[] = (studentTechniquesData || []).map((t: any) => ({
        id: t.id,
        academyId: t.academy_id,
        studentId: t.student_id,
        name: t.name,
        imageUrl: t.image_url,
        category: t.category,
        learnedAt: t.learned_at,
        notes: t.notes,
        createdAt: t.created_at,
      }));

      setStudents(mappedStudents);
      setPayments(mappedPayments);
      setCheckins(mappedCheckins);
      setClasses(mappedClasses);
      setPlans(mappedPlans);
      setTurmas(mappedTurmas);
      setLessonPlans(mappedLessonPlans);
      setStudentTechniques(mappedTechniques);
    } catch (error) {
      console.error("Erro ao buscar dados do Supabase:", error);
    } finally {
      setIsLoading(false);
    }
  }, [academyId, supabase, isLoaded]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==========================================
  // Mutações (Escrevendo no Supabase)
  // ==========================================

  const createStudent = async (studentData: Partial<Student>) => {
    if (!academyId) return { error: "Sem academyId" };
    
    const insertPayload = {
      academy_id: academyId,
      name: studentData.name,
      email: studentData.email || null,
      phone: studentData.phone || null,
      belt_rank: studentData.beltRank || 'BRANCA',
      status: studentData.status || 'ATIVO',
      medical_notes: studentData.medicalRestrictions || null,
      avatar_url: studentData.avatarUrl || null,
      is_exempt: studentData.isExemptFromPayment || false,
      belt_degree: studentData.beltDegree || 0,
      turma_id: studentData.turmaId || null,
      plan_id: studentData.planId || null,
      modality: studentData.modality || 'Judô',
    };

    // Usamos .select() para que o Supabase retorne erro se RLS bloquear
    const { data, error } = await supabase.from('students').insert([insertPayload]).select();

    if (error) {
      console.error("🔴 Supabase Insert Error:", error);
      return { error };
    }
    
    if (!data || data.length === 0) {
      console.error("🔴 INSERT retornou vazio — RLS bloqueou silenciosamente");
      return { error: "RLS bloqueou a inserção. Verifique se a academia existe no banco com o ID: " + academyId };
    }
    
    await fetchData();
    return { success: true };
  };

  const updateStudent = async (studentId: string, updates: Partial<Student>) => {
    // Fazer mapping camelCase -> snake_case antes de enviar
    const payload: any = {};
    if (updates.name) payload.name = updates.name;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.beltRank) payload.belt_rank = updates.beltRank;
    if (updates.status) payload.status = updates.status;
    if (updates.classesAttendedToNextRank !== undefined) payload.classes_attended = updates.classesAttendedToNextRank;
    if (updates.medicalRestrictions !== undefined) payload.medical_notes = updates.medicalRestrictions;
    if (updates.professorNotes !== undefined) payload.professor_notes = updates.professorNotes;
    if (updates.isReadyForExam !== undefined) payload.is_ready_for_exam = updates.isReadyForExam;
    if (updates.beltDegree !== undefined) payload.belt_degree = updates.beltDegree;
    if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
    if (updates.isExemptFromPayment !== undefined) payload.is_exempt = updates.isExemptFromPayment;
    if (updates.checkinBlocked !== undefined) payload.checkin_blocked = updates.checkinBlocked;
    if (updates.checkinBlockReason !== undefined) payload.checkin_block_reason = updates.checkinBlockReason;
    if ((updates as any).classesTargetForNextRank !== undefined) payload.classes_required_for_next_belt = (updates as any).classesTargetForNextRank;
    if (updates.turmaId !== undefined) payload.turma_id = updates.turmaId ? updates.turmaId : null;
    if (updates.planId !== undefined) payload.plan_id = updates.planId ? updates.planId : null;
    if (updates.modality !== undefined) payload.modality = updates.modality;

    const { error } = await supabase.from('students').update(payload).eq('id', studentId);
    if (error) {
      console.error("Supabase Update Error:", error);
    }
    if (!error) {
      await fetchData();
    }
  };

  const deleteStudent = async (studentId: string) => {
    if (!academyId) return { error: "Sem academyId" };
    
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);
      
    if (error) {
      console.error("Supabase Delete Error:", error);
      return { error };
    }
    
    await fetchData();
    return { success: true };
  };

  const createPayment = async (paymentData: Partial<Payment>) => {
    if (!academyId) return;
    const { error } = await supabase.from('payments').insert([{
      academy_id: academyId,
      student_id: paymentData.studentId,
      amount: paymentData.amount,
      description: paymentData.description || 'Mensalidade',
      status: paymentData.status || 'PENDENTE',
      due_date: paymentData.dueDate,
    }]);
    if (!error) {
      await fetchData();
    }
  };

  const updatePaymentStatus = async (paymentId: string, status: PaymentStatus, paidDate?: string) => {
    const { error } = await supabase.from('payments')
      .update({ status, payment_date: paidDate })
      .eq('id', paymentId);
    if (!error) {
      await fetchData();
    }
  };

  const deletePayment = async (paymentId: string) => {
    const { error } = await supabase.from('payments').delete().eq('id', paymentId);
    if (!error) {
      await fetchData();
    }
  };

  const generateMonthlyInvoices = async (monthIndex: number, year: number, defaultAmount: number = 150) => {
    if (!academyId) return 0;
    
    // Se students ainda não carregou, buscar novamente
    if (students.length === 0) {
      console.warn('generateMonthlyInvoices: lista de students vazia, tentando recarregar...');
      await fetchData();
      // Precisamos usar o estado atualizado — mas pelo closure, students pode estar stale
      // Vamos buscar direto do banco
    }

    // Buscar alunos diretamente do banco para evitar problema de closure/state stale
    const { data: freshStudents, error: studentsError } = await supabase
      .from('students')
      .select('id, name, status, is_exempt')
      .eq('academy_id', academyId);

    if (studentsError) {
      console.error('generateMonthlyInvoices: erro ao buscar alunos:', studentsError);
      throw new Error(`Erro ao buscar alunos: ${studentsError.message}`);
    }

    if (!freshStudents || freshStudents.length === 0) {
      console.warn('generateMonthlyInvoices: nenhum aluno encontrado para esta academia');
      return 0;
    }

    // Achar início e fim do mês
    const startObj = new Date(year, monthIndex, 1);
    const endObj = new Date(year, monthIndex + 1, 0);

    const startStr = startObj.toISOString().split('T')[0];
    const endStr = endObj.toISOString().split('T')[0];

    // Verificar quem já tem fatura nesse período
    const { data: existing, error: existingError } = await supabase
      .from('payments')
      .select('student_id')
      .eq('academy_id', academyId)
      .gte('due_date', startStr)
      .lte('due_date', endStr);

    if (existingError) {
      console.error('generateMonthlyInvoices: erro ao verificar faturas existentes:', existingError);
    }

    const existingStudentIds = new Set((existing || []).map((p: any) => p.student_id));
    const activeStudents = freshStudents.filter((s: any) => s.status?.toUpperCase() === 'ATIVO' && !s.is_exempt);

    console.log(`generateMonthlyInvoices: ${activeStudents.length} alunos ativos não-isentos encontrados. ${existingStudentIds.size} já possuem fatura no período.`);

    const toInsert = activeStudents
      .filter((s: any) => !existingStudentIds.has(s.id))
      .map((s: any) => {
        const dueDate = new Date(year, monthIndex, 10);
        const isLate = dueDate.getTime() < new Date().setHours(0,0,0,0);
        return {
          academy_id: academyId,
          student_id: s.id,
          amount: defaultAmount,
          status: isLate ? 'ATRASADO' : 'PENDENTE',
          due_date: dueDate.toISOString().split('T')[0],
          description: `Mensalidade - ${monthIndex + 1}/${year}`
        };
      });

    if (toInsert.length === 0) {
       throw new Error(`DIAGNÓSTICO:\nAlunos na academia: ${freshStudents.length}\nAlunos "Ativos" encontrados: ${activeStudents.length}\nFaturas que JÁ existem no período: ${existingStudentIds.size}\n\nConclusão: Nenhuma fatura nova precisava ser gerada.`);
    }

    const { error: insertError } = await supabase.from('payments').insert(toInsert);
    if (insertError) {
      console.error('generateMonthlyInvoices: erro ao inserir faturas:', insertError);
      throw new Error(`Erro ao salvar faturas no banco (RLS?): ${insertError.message}`);
    }
    
    await fetchData();
    return toInsert.length;
  };

  const recordCheckIn = async (studentId: string, dateStr?: string): Promise<{ success?: boolean; error?: string }> => {
    if (!academyId) return { error: "Sem academyId" };

    // Setar a data base como hoje ou a data fornecida via parâmetro
    // dateStr vem no formato YYYY-MM-DD local
    let targetDate = new Date();
    if (dateStr) {
      const [year, month, day] = dateStr.split('-');
      targetDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), 12, 0, 0); // Meio-dia para evitar fuso negativo
    }

    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).toISOString();
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59).toISOString();

    const { data: existing } = await supabase
      .from('checkins')
      .select('id')
      .eq('student_id', studentId)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    if (existing && existing.length > 0) {
      return { error: "Este aluno já registrou presença no dia selecionado." };
    }

    const { error } = await supabase.from('checkins').insert([{
      academy_id: academyId,
      student_id: studentId,
      created_at: dateStr ? targetDate.toISOString() : undefined
    }]);
    if (!error) {
      // Incrementa o contador de aulas do aluno (+1 presença)
      const student = students.find(s => s.id === studentId);
      if (student) {
        await supabase.from('students').update({
          classes_attended: (student.classesAttendedToNextRank || 0) + 1
        }).eq('id', studentId);
      }
      await fetchData();
      return { success: true };
    }
    return { error: error.message };
  };

  const deleteCheckIn = async (checkinId: string, studentId: string): Promise<{ success?: boolean; error?: string }> => {
    if (!academyId) return { error: "Sem academyId" };

    const { error } = await supabase.from('checkins').delete().eq('id', checkinId);
    
    if (!error) {
      // Decrementa o contador de aulas do aluno (-1 presença), com segurança pra não ficar negativo
      const student = students.find(s => s.id === studentId);
      if (student && (student.classesAttendedToNextRank || 0) > 0) {
        await supabase.from('students').update({
          classes_attended: (student.classesAttendedToNextRank || 0) - 1
        }).eq('id', studentId);
      }
      await fetchData();
      return { success: true };
    }
    return { error: error.message };
  };

  const promoteStudent = async (studentId: string, newBelt: BeltRank) => {
    // Opcionalmente grava no graduation_history
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    await supabase.from('graduation_history').insert([{
      student_id: studentId,
      from_belt: student.beltRank,
      to_belt: newBelt,
    }]);

    await supabase.from('students').update({
       belt_rank: newBelt,
       belt_degree: 0, // Reseta grau — nova faixa começa sem grau
       classes_attended: 0, // Reseta presença
       is_ready_for_exam: false // Remove da fila de graduação
    }).eq('id', studentId);

    await fetchData();
  };

  const updateStudentsPlan = async (planId: string, studentIds: string[]) => {
    // Para desvincular de outros e vincular só os que estão na lista:
    // 1) Nullify plan_id onde estava planId mas não está na nova lista (remoção)
    await supabase.from('students')
      .update({ plan_id: null })
      .eq('plan_id', planId)
      .not('id', 'in', `(${studentIds.join(',') || '00000000-0000-0000-0000-000000000000'})`);

    // 2) Atribui plan_id para os studentIds selecionados
    if (studentIds.length > 0) {
      await supabase.from('students')
        .update({ plan_id: planId })
        .in('id', studentIds);
    }
    
    await fetchData();
  };

  const createClassSession = async (classData: Partial<ClassSession>) => {
    if (!academyId) return;
    const { error } = await supabase.from('class_sessions').insert([{
      academy_id: academyId,
      modality: classData.modality || 'Jiu-Jitsu',
      level: classData.level || 'Todos',
      week_day: classData.weekDay,
      time: classData.time,
      max_students: classData.maxStudents || 20
    }]);
    if (!error) {
      await fetchData();
    }
  };

  const deleteClassSession = async (classId: string) => {
    const { error } = await supabase.from('class_sessions').delete().eq('id', classId);
    if (!error) {
       await fetchData();
    }
  };

  const createPlan = async (planData: Partial<Plan>) => {
    if (!academyId) return;
    const { error } = await supabase.from('plans').insert([{
      academy_id: academyId,
      name: planData.name,
      description: planData.description,
      price: planData.price,
      recurring: planData.recurring,
      classes_per_week: planData.classesPerWeek,
      features: planData.features,
      is_popular: planData.isPopular,
      default_billing_day: planData.defaultBillingDay
    }]);
    if (!error) await fetchData();
  };

  const updatePlan = async (planId: string, planData: Partial<Plan>) => {
    const { error } = await supabase.from('plans').update({
      name: planData.name,
      description: planData.description,
      price: planData.price,
      recurring: planData.recurring,
      classes_per_week: planData.classesPerWeek,
      features: planData.features,
      is_popular: planData.isPopular,
      default_billing_day: planData.defaultBillingDay
    }).eq('id', planId);
    if (!error) await fetchData();
  };

  const deletePlan = async (planId: string) => {
    const { error } = await supabase.from('plans').delete().eq('id', planId);
    if (!error) await fetchData();
  };

  // ==========================================
  // Turmas (Gestão de Classes/Grupos)
  // ==========================================

  const createTurma = async (turmaData: Partial<Turma>) => {
    if (!academyId) return { error: "Sem academyId" };
    
    const insertPayload = {
      academy_id: academyId,
      name: turmaData.name || "Nova Turma",
      schedule: turmaData.schedule || null,
      professor: turmaData.professor || null,
    };

    const { data, error } = await supabase.from('turmas').insert([insertPayload]).select();
    if (error) {
      console.error("Erro insert turma:", JSON.stringify(error, null, 2));
      return { error };
    }
    if (!data || data.length === 0) {
      console.error("INSERT turma retornou vazio. RLX bloqueando?");
      return { error: "RLS bloqueou a inserção ou erro desconhecido." };
    }
    await fetchData();
    return { success: true };
  };

  const updateTurma = async (turmaId: string, turmaData: Partial<Turma>) => {
    const { error } = await supabase.from('turmas').update({
      name: turmaData.name,
      schedule: turmaData.schedule,
      professor: turmaData.professor,
    }).eq('id', turmaId);
    if (!error) await fetchData();
  };

  const deleteTurma = async (turmaId: string) => {
    const { error } = await supabase.from('turmas').delete().eq('id', turmaId);
    if (!error) await fetchData();
  };

  // ==========================================
  // Lesson Plans (Planos de Aula)
  // ==========================================

  const createLessonPlan = async (planData: any) => {
    if (!academyId) return { error: "Sem academyId" };
    
    const insertPayload = {
      academy_id: academyId,
      turma_id: planData.turmaId || null,
      date: planData.date,
      title: planData.title,
      content: planData.content || null,
      observations: planData.observations || null,
    };

    const { data, error } = await supabase.from('lesson_plans').insert([insertPayload]).select();
    if (error) {
      console.error("Erro insert lesson_plan:", JSON.stringify(error, null, 2));
      return { error };
    }
    await fetchData();
    return { success: true };
  };

  const updateLessonPlan = async (planId: string, planData: any) => {
    const { error } = await supabase.from('lesson_plans').update({
      turma_id: planData.turmaId || null,
      date: planData.date,
      title: planData.title,
      content: planData.content,
      observations: planData.observations,
    }).eq('id', planId);
    if (!error) await fetchData();
  };

  const deleteLessonPlan = async (planId: string) => {
    const { error } = await supabase.from('lesson_plans').delete().eq('id', planId);
    if (!error) await fetchData();
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!academyId) return null;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${academyId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        console.error("Erro no upload do avatar:", uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error("Catch erro no upload do avatar:", err);
      return null;
    }
  };

  const uploadTechniqueImage = async (file: File): Promise<string | null> => {
    if (!academyId) return null;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${academyId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('technique-images')
        .upload(filePath, file);

      if (uploadError) return null;

      const { data } = supabase.storage
        .from('technique-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      return null;
    }
  };

  const createStudentTechnique = async (techData: Partial<StudentTechnique>) => {
    if (!academyId) return;
    const { error } = await supabase.from('student_techniques').insert([{
      academy_id: academyId,
      student_id: techData.studentId,
      name: techData.name,
      image_url: techData.imageUrl || null,
      category: techData.category || null,
      learned_at: techData.learnedAt || new Date().toISOString().split('T')[0],
      notes: techData.notes || null,
    }]);
    if (error) throw new Error(error.message);
    await fetchData();
  };

  const createMultipleStudentTechniques = async (techDataArray: Partial<StudentTechnique>[]) => {
    if (!academyId || techDataArray.length === 0) return;
    const payload = techDataArray.map(techData => ({
      academy_id: academyId,
      student_id: techData.studentId,
      name: techData.name,
      image_url: techData.imageUrl || null,
      category: techData.category || null,
      learned_at: techData.learnedAt || new Date().toISOString().split('T')[0],
      notes: techData.notes || null,
    }));
    
    const { error } = await supabase.from('student_techniques').insert(payload);
    if (error) throw new Error(error.message);
    await fetchData();
  };

  const deleteStudentTechnique = async (id: string) => {
    const { error } = await supabase.from('student_techniques').delete().eq('id', id);
    if (!error) await fetchData();
  };

  const updateStudentTechnique = async (id: string, updates: Partial<StudentTechnique>) => {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const { error } = await supabase.from('student_techniques').update(payload).eq('id', id);
    if (error) throw new Error(error.message);
    await fetchData();
  };

  const updateMultipleStudentTechniques = async (ids: string[], updates: Partial<StudentTechnique>) => {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const { error } = await supabase.from('student_techniques').update(payload).in('id', ids);
    if (error) throw new Error(error.message);
    await fetchData();
  };

  return {
    students,
    payments,
    checkins,
    classes,
    plans,
    turmas,
    lessonPlans,
    studentTechniques,
    isLoading,
    refetch: fetchData,
    
    // Mutações
    createStudent,
    updateStudent,
    deleteStudent,
    createPayment,
    updatePaymentStatus,
    deletePayment,
    generateMonthlyInvoices,
    recordCheckIn,
    deleteCheckIn,
    promoteStudent,
    createClassSession,
    deleteClassSession,
    createPlan,
    updatePlan,
    deletePlan,
    updateStudentsPlan,
    createTurma,
    updateTurma,
    deleteTurma,
    createLessonPlan,
    updateLessonPlan,
    deleteLessonPlan,
    uploadAvatar,
    uploadTechniqueImage,
    createStudentTechnique,
    createMultipleStudentTechniques,
    deleteStudentTechnique,
    updateStudentTechnique,
    updateMultipleStudentTechniques,
  };
}
