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
  useCreateAnnouncement,
  getListAnnouncementsQueryKey,
} from "@workspace/api-client-react";

const schema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  body: z.string().min(1, "Isi pengumuman wajib diisi"),
  category: z.enum(["info", "warning", "urgent"]),
  audience: z.string().default("all"),
  publishedAt: z.string().min(1, "Tanggal publikasi wajib diisi"),
});

type FormValues = z.infer<typeof schema>;

export default function AddAnnouncement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createAnnouncement = useCreateAnnouncement();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      body: "",
      category: "info",
      audience: "all",
      publishedAt: new Date().toISOString().split("T")[0],
    },
  });

  const onSubmit = (data: FormValues) => {
    createAnnouncement.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Berhasil", description: "Pengumuman berhasil ditambahkan" });
        queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
        setLocation("/pengumuman");
      },
      onError: () => {
        toast({ title: "Gagal", description: "Terjadi kesalahan saat menambahkan pengumuman", variant: "destructive" });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/pengumuman">
          <Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Tambah Pengumuman</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Informasi Pengumuman</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul</FormLabel>
                  <FormControl><Input placeholder="Judul pengumuman" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="body" render={({ field }) => (
                <FormItem>
                  <FormLabel>Isi Pengumuman</FormLabel>
                  <FormControl><Textarea placeholder="Isi pengumuman..." rows={5} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Peringatan</SelectItem>
                        <SelectItem value="urgent">Mendesak</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="audience" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audiens</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Pilih audiens" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">Semua Kru</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="publishedAt" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Publikasi</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="flex justify-end gap-4">
                <Link href="/pengumuman">
                  <Button type="button" variant="outline">Batal</Button>
                </Link>
                <Button type="submit" disabled={createAnnouncement.isPending}>
                  {createAnnouncement.isPending ? "Menyimpan..." : "Simpan Pengumuman"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
