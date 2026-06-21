import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListEmployees,
  getListEmployeesQueryKey,
  useCreateSchedule,
  getListSchedulesQueryKey,
} from "@workspace/api-client-react";

const schema = z.object({
  employeeId: z.coerce.number().int().positive("Pilih kru terlebih dahulu"),
  date: z.string().min(1, "Tanggal wajib diisi"),
  shift: z.string().min(1, "Shift wajib diisi"),
  title: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function AddSchedule() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees } = useListEmployees(undefined, {
    query: { queryKey: getListEmployeesQueryKey() },
  });

  const createSchedule = useCreateSchedule();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: 0,
      date: new Date().toISOString().split("T")[0],
      shift: "",
      title: "",
      location: "",
      notes: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    createSchedule.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Berhasil", description: "Jadwal berhasil ditambahkan" });
        queryClient.invalidateQueries({ queryKey: getListSchedulesQueryKey() });
        setLocation("/jadwal");
      },
      onError: () => {
        toast({ title: "Gagal", description: "Terjadi kesalahan saat menambahkan jadwal", variant: "destructive" });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/jadwal">
          <Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Tambah Jadwal Kerja</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Informasi Jadwal</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField control={form.control} name="employeeId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kru</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={field.value ? String(field.value) : undefined}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Pilih kru" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees?.map((emp) => (
                          <SelectItem key={emp.id} value={String(emp.id)}>
                            {emp.name} — {emp.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="shift" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shift</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Pilih shift" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pagi">Pagi (06:00–14:00)</SelectItem>
                        <SelectItem value="Siang">Siang (14:00–22:00)</SelectItem>
                        <SelectItem value="Malam">Malam (22:00–06:00)</SelectItem>
                        <SelectItem value="Penuh">Penuh (08:00–17:00)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul (opsional)</FormLabel>
                    <FormControl><Input placeholder="Cth: Tugas Khusus" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lokasi (opsional)</FormLabel>
                    <FormControl><Input placeholder="Cth: Gudang A" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan (opsional)</FormLabel>
                  <FormControl><Textarea placeholder="Catatan tambahan..." rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex justify-end gap-4">
                <Link href="/jadwal">
                  <Button type="button" variant="outline">Batal</Button>
                </Link>
                <Button type="submit" disabled={createSchedule.isPending}>
                  {createSchedule.isPending ? "Menyimpan..." : "Simpan Jadwal"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
